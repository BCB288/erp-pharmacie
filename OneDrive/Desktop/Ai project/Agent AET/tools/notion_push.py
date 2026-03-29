"""
Tool: notion_push.py
Role: Pousse les contenus générés vers Notion (posts, calendrier, veille).
Usage:
  python tools/notion_push.py --type post --input ".tmp/post_draft.json" --date "2026-04-05" --plateforme instagram
  python tools/notion_push.py --type calendrier --input ".tmp/calendrier_2026-04.json"
  python tools/notion_push.py --type veille --input ".tmp/veille_2026-03-28.json"

Requires in .env:
  NOTION_API_KEY=secret_xxx
  NOTION_CALENDAR_DB_ID=xxx  # ID de la base "Calendrier Éditorial AET"
  NOTION_VEILLE_DB_ID=xxx    # ID de la base "Veille AET"
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass  # .env loading is optional if vars are already set

NOTION_VERSION = "2022-06-28"
NOTION_BASE_URL = "https://api.notion.com/v1"

PLATFORM_COLORS = {
    "facebook": "blue",
    "instagram": "pink",
    "tiktok": "purple",
    "google": "green",
}

STATUS_OPTIONS = ["Brouillon", "Prêt", "Programmé", "Publié", "Urgent"]


def get_headers() -> dict:
    api_key = os.environ.get("NOTION_API_KEY")
    if not api_key:
        print("ERROR: NOTION_API_KEY manquant dans .env")
        sys.exit(1)
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
    }


def create_post_page(data: dict, date: str, plateforme: str, db_id: str) -> dict:
    """Crée une page dans la base Calendrier Éditorial pour un post."""
    sujet = data.get("sujet", "Post sans titre")
    texte = data.get("texte") or data.get("reponse", "")
    hashtags = " ".join(data.get("hashtags", []))
    cta = data.get("cta", "")

    title = f"[{plateforme.upper()}] {sujet} — {date}"

    payload = {
        "parent": {"database_id": db_id},
        "properties": {
            "Titre": {"title": [{"text": {"content": title}}]},
            "Plateforme": {"select": {"name": plateforme.capitalize()}},
            "Statut": {"select": {"name": "Brouillon"}},
            "Date de publication": {"date": {"start": date}},
            "Sujet": {"rich_text": [{"text": {"content": sujet}}]},
        },
        "children": [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {"rich_text": [{"text": {"content": "Contenu du post"}}]},
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {"rich_text": [{"text": {"content": texte}}]},
            },
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {"rich_text": [{"text": {"content": "Hashtags"}}]},
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {"rich_text": [{"text": {"content": hashtags}}]},
            },
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {"rich_text": [{"text": {"content": "Call to Action"}}]},
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {"rich_text": [{"text": {"content": cta}}]},
            },
        ],
    }
    response = requests.post(f"{NOTION_BASE_URL}/pages", headers=get_headers(), json=payload)
    response.raise_for_status()
    return response.json()


def create_calendrier_pages(data: dict, db_id: str) -> list:
    """Crée une page par entrée dans le calendrier éditorial."""
    pages_created = []
    for post in data.get("posts", []):
        page_data = {
            "sujet": post.get("sujet", ""),
            "texte": "",
            "hashtags": [],
            "cta": "",
        }
        result = create_post_page(page_data, post["date"], post["plateforme"], db_id)
        pages_created.append(result.get("url", ""))
        print(f"  ✅ {post['date']} [{post['plateforme']}] {post['sujet']}")
    return pages_created


def create_veille_entry(item: dict, db_id: str) -> dict:
    """Crée une entrée de veille dans Notion."""
    payload = {
        "parent": {"database_id": db_id},
        "properties": {
            "Message": {"title": [{"text": {"content": item.get("message_original", "")[:100]}}]},
            "Canal": {"select": {"name": item.get("canal", "Inconnu").capitalize()}},
            "Catégorie": {"select": {"name": item.get("categorie_label", "Info")}},
            "Statut": {"select": {"name": "À traiter"}},
            "Date": {"date": {"start": item.get("date", datetime.now().strftime("%Y-%m-%d"))}},
        },
        "children": [
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"text": {"content": f"Message: {item.get('message_original', '')}"}}]
                },
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"text": {"content": f"Réponse suggérée: {item.get('reponse', 'À rédiger')}"}}]
                },
            },
        ],
    }
    response = requests.post(f"{NOTION_BASE_URL}/pages", headers=get_headers(), json=payload)
    response.raise_for_status()
    return response.json()


def main():
    parser = argparse.ArgumentParser(description="Push contenu AET vers Notion")
    parser.add_argument("--type", required=True, choices=["post", "calendrier", "veille"])
    parser.add_argument("--input", required=True, help="Fichier JSON source")
    parser.add_argument("--date", help="Date de publication (pour --type post)")
    parser.add_argument("--plateforme", help="Plateforme cible (pour --type post)")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"[notion_push] Envoi vers Notion (type: {args.type})...")

    if args.type == "post":
        db_id = os.environ.get("NOTION_CALENDAR_DB_ID")
        if not db_id:
            print("ERROR: NOTION_CALENDAR_DB_ID manquant dans .env")
            sys.exit(1)
        if not args.date or not args.plateforme:
            print("ERROR: --date et --plateforme requis pour --type post")
            sys.exit(1)
        result = create_post_page(data, args.date, args.plateforme, db_id)
        url = result.get("url", "N/A")
        print(f"[notion_push] ✅ Post créé → {url}")

    elif args.type == "calendrier":
        db_id = os.environ.get("NOTION_CALENDAR_DB_ID")
        if not db_id:
            print("ERROR: NOTION_CALENDAR_DB_ID manquant dans .env")
            sys.exit(1)
        pages = create_calendrier_pages(data, db_id)
        print(f"[notion_push] ✅ {len(pages)} entrées calendrier créées")

    elif args.type == "veille":
        db_id = os.environ.get("NOTION_VEILLE_DB_ID")
        if not db_id:
            print("ERROR: NOTION_VEILLE_DB_ID manquant dans .env")
            sys.exit(1)
        items = data if isinstance(data, list) else data.get("interactions", [])
        for item in items:
            result = create_veille_entry(item, db_id)
            print(f"  ✅ Veille: {item.get('message_original', '')[:50]}...")
        print(f"[notion_push] ✅ {len(items)} interactions loggées")


if __name__ == "__main__":
    main()
