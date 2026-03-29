"""
Tool: veille.py
Role: Collecte et catégorise les interactions sur les réseaux sociaux AET.
Note: Sans API officielle Facebook/Instagram, ce script gère un fichier d'interactions
      saisies manuellement ou importées depuis les exports natifs des plateformes.

Usage:
  # Mode interactif (saisir manuellement une interaction)
  python tools/veille.py --canal facebook --mode interactif

  # Mode import fichier CSV (export Facebook/Instagram)
  python tools/veille.py --canal instagram --mode import --fichier "export_ig.csv"

  # Mode batch (traiter un fichier JSON existant)
  python tools/veille.py --input ".tmp/interactions_brutes.json"
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass

CATEGORIE_LABELS = {
    "1": "Demande d'information",
    "2": "Commentaire positif",
    "3": "Plainte",
    "4": "Spam / Inapproprié",
    "5": "Partenariat / Presse",
}

CATEGORIZATION_PROMPT = """Tu es le community manager de l'Auto École Tigana (AET).

Analyse ce message et classe-le dans l'une des catégories suivantes :
1 = Demande d'information (prix, inscription, horaires, etc.)
2 = Commentaire positif / Témoignage
3 = Plainte ou avis négatif
4 = Spam ou contenu inapproprié
5 = Demande de partenariat / presse

MESSAGE : "{message}"
CANAL : {canal}

Retourne UNIQUEMENT un JSON :
{{
  "categorie": "<1|2|3|4|5>",
  "categorie_label": "<label>",
  "priorite": "<haute|normale|basse>",
  "resume": "<résumé en 10 mots max>",
  "action_requise": "<oui|non>",
  "validation_humaine": "<oui|non>"
}}

Note: validation_humaine = "oui" uniquement pour les catégories 3 (plainte)."""


def categorize_interaction(message: str, canal: str) -> dict:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    prompt = CATEGORIZATION_PROMPT.format(message=message, canal=canal)
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()
    return json.loads(raw)


def process_interactions(interactions: list, canal: str) -> list:
    results = []
    for idx, interaction in enumerate(interactions):
        message = interaction if isinstance(interaction, str) else interaction.get("message", "")
        print(f"  [{idx+1}/{len(interactions)}] Catégorisation: {message[:50]}...")
        meta = categorize_interaction(message, canal)
        result = {
            "canal": canal,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "message_original": message,
            **meta,
        }
        results.append(result)
        # Flag urgent items
        if meta.get("priorite") == "haute":
            print(f"    ⚠️ PRIORITÉ HAUTE — {meta.get('categorie_label')}")
        if meta.get("validation_humaine") == "oui":
            print(f"    🔴 VALIDATION HUMAINE REQUISE")
    return results


def interactive_mode(canal: str) -> list:
    """Permet de saisir manuellement des interactions une par une."""
    interactions = []
    print(f"\n[veille] Mode interactif — Canal: {canal}")
    print("Saisissez les messages à analyser. Tapez 'fin' pour terminer.\n")
    while True:
        message = input("Message > ").strip()
        if message.lower() in ("fin", "exit", "q"):
            break
        if message:
            interactions.append(message)
    return process_interactions(interactions, canal)


def import_csv(fichier: str, canal: str) -> list:
    """Importe depuis un CSV d'export natif Facebook/Instagram."""
    import csv
    interactions = []
    with open(fichier, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Facebook export uses 'Comment' column, Instagram uses 'text'
            message = row.get("Comment") or row.get("text") or row.get("message") or ""
            if message.strip():
                interactions.append(message.strip())
    print(f"[veille] {len(interactions)} messages importés depuis {fichier}")
    return process_interactions(interactions, canal)


def main():
    parser = argparse.ArgumentParser(description="Veille réseaux sociaux AET")
    parser.add_argument("--canal", choices=["facebook", "instagram", "tiktok", "google"], default="facebook")
    parser.add_argument("--mode", choices=["interactif", "import"], default="interactif")
    parser.add_argument("--fichier", help="Fichier CSV à importer (mode import)")
    parser.add_argument("--input", help="Fichier JSON d'interactions brutes existant")
    parser.add_argument("--periode", default="24h", help="Période (info uniquement)")
    args = parser.parse_args()

    print(f"[veille] Démarrage — Canal: {args.canal} | Période: {args.periode}")

    if args.input:
        with open(args.input, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        interactions_brutes = raw_data if isinstance(raw_data, list) else raw_data.get("interactions", [])
        results = process_interactions(interactions_brutes, args.canal)
    elif args.mode == "import" and args.fichier:
        results = import_csv(args.fichier, args.canal)
    else:
        results = interactive_mode(args.canal)

    if not results:
        print("[veille] Aucune interaction à traiter.")
        return

    # Save to .tmp/
    tmp_dir = Path(__file__).parent.parent / ".tmp"
    tmp_dir.mkdir(exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")
    output_file = tmp_dir / f"veille_{date_str}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # Summary
    plaintes = sum(1 for r in results if r.get("categorie") == "3")
    validations = sum(1 for r in results if r.get("validation_humaine") == "oui")
    hautes = sum(1 for r in results if r.get("priorite") == "haute")

    print(f"\n[veille] ✅ {len(results)} interactions traitées → {output_file}")
    print(f"  📊 Plaintes: {plaintes} | Priorité haute: {hautes} | Validation requise: {validations}")
    print("\nProchaine étape: python tools/notion_push.py --type veille --input " + str(output_file))


if __name__ == "__main__":
    main()
