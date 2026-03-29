"""
Tool: post_generator.py
Role: Génère du contenu social media aligné avec le brand kit AET via l'API Claude.
Usage:
  python tools/post_generator.py --plateforme instagram --sujet "Promo permis B" --objectif "attirer des inscrits" --ton motivant
  python tools/post_generator.py --type reponse --categorie "1" --message_original "C'est combien le permis B ?"
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)

# ── Brand Kit AET ────────────────────────────────────────────────────────────
BRAND_KIT = {
    "nom": "Auto École Tigana (AET)",
    "devise": "Pour mieux conduire, mieux apprendre.",
    "accroche": "Bienvenue au royaume de la conduite",
    "ton": "Professionnel mais familial, bienveillant, pédagogue, axé sécurité routière",
    "chiffres_cles": "+27 ans · +30 000 permis · +98% taux de réussite · +150 leçons/mois",
    "contact": "+223 76393170 | infos@autoecoletigana.com | client.autoecoletigana.com/go",
    "tarifs": {
        "permis_b": "120 000 F CFA",
        "permis_c": "150 000 F CFA",
        "permis_a": "75 000 F CFA",
        "perfectionnement": "50 000 F CFA",
    },
    "reseaux": {
        "facebook": "facebook.com/AUTOECOLETIGANA1",
        "instagram": "@autoecoletigana1",
    },
}

PLATFORM_CONSTRAINTS = {
    "facebook": {"max_words": 400, "hashtags": "3-5", "emojis": "modéré (3-5)"},
    "instagram": {"max_words": 150, "hashtags": "10-15", "emojis": "abondant (5-10)"},
    "tiktok": {"max_words": 80, "hashtags": "5-8", "emojis": "abondant"},
}

RESPONSE_TEMPLATES = {
    "1": "Demande d'information — répondre avec précision et un CTA téléphone/email",
    "2": "Commentaire positif — remercier chaleureusement et valoriser l'élève",
    "3": "Plainte — reconnaître, s'excuser sans admettre de faute, proposer contact privé",
    "5": "Partenariat / presse — rediriger vers infos@autoecoletigana.com",
}


def build_post_prompt(plateforme: str, sujet: str, objectif: str, ton: str) -> str:
    constraints = PLATFORM_CONSTRAINTS.get(plateforme, {})
    return f"""Tu es le community manager de l'{BRAND_KIT['nom']}.

BRAND KIT :
- Devise : « {BRAND_KIT['devise']} »
- Accroche : « {BRAND_KIT['accroche']} »
- Ton : {BRAND_KIT['ton']}
- Chiffres clés : {BRAND_KIT['chiffres_cles']}
- Contact : {BRAND_KIT['contact']}

MISSION : Rédige un post {plateforme.upper()} sur le sujet "{sujet}".
OBJECTIF : {objectif}
TON DEMANDÉ : {ton}
CONTRAINTES :
- Longueur max : {constraints.get('max_words', 200)} mots
- Hashtags : {constraints.get('hashtags', '5-10')}
- Emojis : {constraints.get('emojis', 'modéré')}

RÈGLES :
1. Intégrer la devise ou l'accroche si le post est important
2. Valoriser au moins un chiffre clé si pertinent
3. Terminer par un CTA clair : client.autoecoletigana.com/go ou +223 76393170
4. Signer "L'équipe AET" ou "Auto École Tigana"
5. Ne jamais promettre un taux de réussite de 100%

Retourne UNIQUEMENT un JSON avec cette structure :
{{
  "plateforme": "{plateforme}",
  "sujet": "{sujet}",
  "texte": "<contenu du post>",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "cta": "<appel à l'action>",
  "notes": "<remarques optionnelles>"
}}"""


def build_response_prompt(categorie: str, message_original: str) -> str:
    template = RESPONSE_TEMPLATES.get(categorie, "Répondre de manière professionnelle et bienveillante")
    return f"""Tu es le community manager de l'{BRAND_KIT['nom']}.

BRAND KIT :
- Ton : {BRAND_KIT['ton']}
- Contact : {BRAND_KIT['contact']}

MESSAGE REÇU : "{message_original}"
CATÉGORIE : {categorie} — {template}

RÈGLES :
1. Personnaliser si un prénom est disponible
2. Signer "L'équipe AET"
3. Jamais de promesse publique — rediriger vers contact privé pour les engagements
4. Maximum 50 mots

Retourne UNIQUEMENT un JSON :
{{
  "message_original": "{message_original}",
  "categorie": "{categorie}",
  "reponse": "<texte de la réponse>",
  "action_requise": "<si validation humaine nécessaire: oui/non>"
}}"""


def generate_content(prompt: str) -> dict:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    # Extract JSON if wrapped in markdown code block
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()
    return json.loads(raw)


def main():
    parser = argparse.ArgumentParser(description="Générateur de contenu social media AET")
    parser.add_argument("--type", default="post", choices=["post", "reponse"])
    # Post args
    parser.add_argument("--plateforme", choices=["facebook", "instagram", "tiktok"])
    parser.add_argument("--sujet")
    parser.add_argument("--objectif")
    parser.add_argument("--ton", default="motivant")
    # Response args
    parser.add_argument("--categorie")
    parser.add_argument("--message_original")
    args = parser.parse_args()

    if args.type == "post":
        if not all([args.plateforme, args.sujet, args.objectif]):
            print("ERROR: --plateforme, --sujet et --objectif sont requis pour --type post")
            sys.exit(1)
        prompt = build_post_prompt(args.plateforme, args.sujet, args.objectif, args.ton)
    else:
        if not all([args.categorie, args.message_original]):
            print("ERROR: --categorie et --message_original sont requis pour --type reponse")
            sys.exit(1)
        prompt = build_response_prompt(args.categorie, args.message_original)

    print(f"[post_generator] Génération en cours ({args.type})...")
    result = generate_content(prompt)

    # Save to .tmp/
    tmp_dir = Path(__file__).parent.parent / ".tmp"
    tmp_dir.mkdir(exist_ok=True)
    output_file = tmp_dir / "post_draft.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"[post_generator] ✅ Contenu généré → {output_file}")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


if __name__ == "__main__":
    main()
