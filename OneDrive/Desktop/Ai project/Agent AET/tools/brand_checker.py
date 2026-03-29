"""
Tool: brand_checker.py
Role: Évalue la cohérence de marque d'un contenu par rapport au brand kit AET.
Usage:
  python tools/brand_checker.py --input ".tmp/post_draft.json"
  python tools/brand_checker.py --text "Votre texte ici"
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)

SCORING_PROMPT = """Tu es un expert en brand management pour l'Auto École Tigana (AET).

BRAND KIT AET :
- Nom : Auto École Tigana (AET)
- Devise : « Pour mieux conduire, mieux apprendre. »
- Accroche : « Bienvenue au royaume de la conduite »
- Ton : Professionnel mais familial, bienveillant, pédagogue, axé sécurité routière
- Positionnement : Institution de référence en formation à la conduite au Mali
- Chiffres clés : +27 ans · +30 000 permis · +98% taux de réussite
- Valeurs : Sécurité routière, accompagnement personnalisé, progression à son rythme
- À éviter : promesses absolues ("100% de réussite"), ton trop corporatif, erreurs factuelles sur les tarifs

CONTENU À ÉVALUER :
{contenu}

GRILLE DE NOTATION (100 points total) :

A. Ton & Voix (30 pts)
- Professionnel mais accessible (10 pts)
- Bienveillant et rassurant (10 pts)
- Orienté pédagogie (10 pts)

B. Messages clés (30 pts)
- Mise en avant expérience/chiffres si pertinent (10 pts)
- Lien avec la sécurité routière (10 pts)
- CTA clair présent (10 pts)

C. Identité de marque (20 pts)
- Nom AET mentionné (10 pts)
- Devise/accroche intégrée si post important (10 pts)

D. Conformité (20 pts)
- Pas de promesse impossible (10 pts)
- Pas d'erreur factuelle (10 pts)

Retourne UNIQUEMENT un JSON :
{{
  "score_total": <0-100>,
  "scores_detail": {{
    "ton_voix": <0-30>,
    "messages_cles": <0-30>,
    "identite": <0-20>,
    "conformite": <0-20>
  }},
  "decision": "<APPROUVE|APPROUVE_AVEC_AJUSTEMENTS|REVISION_REQUISE|REJETE>",
  "points_forts": ["<point 1>", "<point 2>"],
  "corrections": [
    {{"probleme": "<description>", "suggestion": "<correction proposée>"}}
  ]
}}"""


def check_brand(contenu: str) -> dict:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": SCORING_PROMPT.format(contenu=contenu)}],
    )
    raw = message.content[0].text.strip()
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()
    return json.loads(raw)


def main():
    parser = argparse.ArgumentParser(description="Vérificateur de cohérence de marque AET")
    parser.add_argument("--input", help="Chemin vers un fichier JSON (.tmp/post_draft.json)")
    parser.add_argument("--text", help="Texte brut à analyser directement")
    args = parser.parse_args()

    if args.input:
        with open(args.input, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Extract text content from various JSON structures
        contenu = data.get("texte") or data.get("reponse") or json.dumps(data, ensure_ascii=False)
    elif args.text:
        contenu = args.text
    else:
        print("ERROR: Fournir --input ou --text")
        sys.exit(1)

    print("[brand_checker] Analyse en cours...")
    result = check_brand(contenu)

    # Save result
    tmp_dir = Path(__file__).parent.parent / ".tmp"
    tmp_dir.mkdir(exist_ok=True)
    output_file = tmp_dir / "brand_check_result.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    score = result["score_total"]
    decision = result["decision"]

    # Visual output
    emoji = "✅" if score >= 90 else "⚠️" if score >= 80 else "🔄" if score >= 70 else "❌"
    print(f"\n{emoji} Score brand: {score}/100 — {decision}")
    print(f"   Ton & Voix    : {result['scores_detail']['ton_voix']}/30")
    print(f"   Messages clés : {result['scores_detail']['messages_cles']}/30")
    print(f"   Identité      : {result['scores_detail']['identite']}/20")
    print(f"   Conformité    : {result['scores_detail']['conformite']}/20")

    if result["points_forts"]:
        print("\n✔ Points forts :")
        for p in result["points_forts"]:
            print(f"  - {p}")

    if result["corrections"]:
        print("\n⚡ Corrections suggérées :")
        for c in result["corrections"]:
            print(f"  - {c['probleme']}")
            print(f"    → {c['suggestion']}")

    print(f"\n[brand_checker] Résultat sauvegardé → {output_file}")
    return result


if __name__ == "__main__":
    main()
