"""
Tool: blaze_optimizer.py
Role: Génère un audit complet des paramètres Blaze AET et produit le Brand Guide
      à uploader dans Blaze > Source Materials pour maximiser la fidélité des outputs.

Usage:
  python tools/blaze_optimizer.py --action audit
  python tools/blaze_optimizer.py --action generate_brand_guide
  python tools/blaze_optimizer.py --action full   # audit + brand guide
"""

import argparse
import json
from datetime import datetime
from pathlib import Path

# ── Référentiel brand AET complet ────────────────────────────────────────────
AET_BRAND_REFERENCE = {
    "identite": {
        "nom_officiel": "Auto École Tigana",
        "acronyme": "AET",
        "devise": "Pour mieux conduire, mieux apprendre.",
        "accroche": "Bienvenue au royaume de la conduite",
        "positionnement": "Institution de référence en formation à la conduite au Mali — sérieux, compétence, expérience depuis +27 ans",
        "slogan_famille": "Plus qu'une école, une famille",
    },
    "contacts": {
        "telephone": "+223 76393170",
        "email": "infos@autoecoletigana.com",
        "email_pro": "infos@autoecoletigana.com",
        "portail_inscription": "client.autoecoletigana.com/go",
        "siege": "Baco-Djicoroni, Bamako, Mali (près de la station Total)",
        "agence2": "Sikasso, Mali",
        "site_web": "www.autoecoletigana.com",
        "facebook": "facebook.com/AUTOECOLETIGANA1",
        "instagram": "@autoecoletigana1",
    },
    "chiffres_cles": {
        "experience": "+27 ans",
        "permis_delivres": "+30 000",
        "taux_reussite": "+98%",
        "lecons_par_mois": "+150 leçons pratiques/mois",
        "fondation": "Fondée il y a +27 ans par des passionnés de l'enseignement routier",
    },
    "services": {
        "permis_b": {"tarif": "120 000 F CFA", "duree": "4-6 semaines", "details": "Véhicules légers < 3,5T, inscription + examen inclus"},
        "permis_c": {"tarif": "150 000 F CFA", "duree": "6-8 semaines", "details": "Poids lourds > 3,5T, inscription + examen inclus"},
        "permis_a": {"tarif": "75 000 F CFA", "duree": "3-4 semaines", "details": "Deux-roues motorisés"},
        "permis_d": {"tarif": "75 000 F CFA", "details": "Transport en commun > 9 places"},
        "permis_e": {"tarif": "65 000 F CFA", "details": "Semi-remorque, extension de catégorie"},
        "perfectionnement": {"tarif": "50 000 F CFA", "duree": "10 jours"},
        "simulateur": {"tarif": "5 000 F CFA/séance 30 min", "details": "Technologie immersive"},
        "reduction_etudiants": "10 000 F CFA de réduction pour étudiants, apprentis, mécaniciens, enseignants, porteurs d'uniforme",
    },
    "audience": {
        "primaire": "Jeunes d'Afrique de l'ouest de 18 à 30 ans (Mali, Niger, Burkina Faso) souhaitant obtenir leur premier permis",
        "secondaire": "Professionnels et conducteurs expérimentés cherchant à se perfectionner ou changer de catégorie",
        "tertiaire": "Parents souhaitant inscrire leurs enfants, entreprises cherchant des formations professionnelles",
        "geographie": "Afrique de l'ouest — Mali (Bamako, Sikasso), Niger, Burkina Faso",
    },
    "brand_voice_blaze": {
        "purpose": "Promote professional driving education in Mali. Build trust and community with students and families in Bamako and Sikasso. Inform about AET's services, 27+ years of expertise, and 98%+ success rate.",
        "audience": "Young West Africans aged 18-35 in Mali, Niger and Burkina Faso seeking their first driver's license. Professionals looking to upgrade their license category. Parents considering driving school for their children.",
        "tone": ["Encouraging and supportive", "Informative yet approachable", "Confident and knowledgeable"],
        "emotions": ["Empowerment through education", "Trust and reliability", "Community and belonging"],
        "character": [
            "A mentor guiding learners towards independence and safety on Malian roads",
            "A supportive family-like figure — 'Plus qu'une école, une famille'",
            "A reliable and proven partner with 27+ years and 30,000+ licenses delivered",
        ],
        "syntax": [
            "Use clear and concise sentences averaging around 15 words",
            "Incorporate bullet points or lists for easy readability",
            "Employ direct calls to action to engage the audience",
            "Always end social posts with: client.autoecoletigana.com/go or +223 76393170",
        ],
        "language": [
            "Write ALL captions and social content in French",
            "Use simple, everyday language that is friendly and inviting",
            "Incorporate specific terminology related to driving education in Mali (permis B/C/A, code de la route, moniteur)",
            "Maintain an informal style while remaining professional",
            "Reference Malian context: Bamako, Baco-Djicoroni, Sikasso when relevant",
            "Never write in English for captions — always French",
        ],
    },
    "visual_identity": {
        "description": "The brand's visual language employs a warm, welcoming photographic style centered on group imagery and candid moments of Malian students learning to drive. Subjects are predominantly Malian, dressed in contemporary and traditional Malian clothing, exuding approachability and community spirit. Mid-range group shots that show faces clearly while providing context — driving school classrooms, vehicles, Bamako streets. Lighting is soft and natural, warm skin tones. AET logo always visible. Colors: deep crimson red, dark navy blue, off-white, black.",
        "couleurs": {
            "rouge_aet": "Crimson/Deep Red (#8B1A3A approximately) — couleur principale de la marque",
            "bleu_marine": "Dark Navy Blue (#1E2D4E approximately) — couleur secondaire",
            "blanc_casse": "Off-white/Light Gray — fond neutre",
            "noir": "Black — texte et accents",
        },
        "typographie": {
            "titre": "AG Book Rounded W — Regular 20",
            "corps": "Helvetica World — Regular 20",
        },
    },
    "content_preferences": {
        "general": {
            "market_location": "Afrique de l'ouest (Mali, Niger, Burkina Faso)",
            "target_audience": "Young West Africans 18-35, professionals, parents in Mali, Niger and Burkina Faso seeking driving education",
            "people_in_content": "Diverse West African community, mixed gender, ages 18-45, contemporary and traditional clothing",
        },
        "social_media": {
            "default_cta": "Inscrivez-vous : client.autoecoletigana.com/go | +223 76393170 | infos@autoecoletigana.com",
            "hashtags_principaux": [
                "#AutoEcoleTigana", "#AET", "#PermisConduire", "#PermisB",
                "#Bamako", "#Mali", "#Niger", "#BurkinaFaso", "#SecuriteRoutiere",
                "#CodeDeLaRoute", "#ApprendreAConduire", "#AfriqueOuest",
            ],
            "logo_frequency": "Always include AET logo in posts",
            "language": "French for all captions",
        },
        "blog_email": {
            "cta": "Inscrivez-vous : client.autoecoletigana.com/go | +223 76393170 | infos@autoecoletigana.com",
            "external_links": "Link to client.autoecoletigana.com/go and www.autoecoletigana.com",
            "language": "French",
        },
    },
    "partenaires": [
        "Ministère des Transports et des Infrastructures du Mali",
        "Direction Générale des Transports",
        "Police Nationale / Gendarmerie",
        "Agence Nationale de la Sécurité Routière (ANASER)",
        "ISIC Mali (réductions pour porteurs de carte ISIC)",
    ],
}

# ── Audit config ─────────────────────────────────────────────────────────────
BLAZE_AUDIT_CHECKLIST = [
    {
        "section": "Brand Kit > Brand Profile",
        "priorite": 1,
        "champ": "Business Description",
        "statut_actuel": "inconnu",
        "valeur_recommandee": (
            "Auto École Tigana (AET) est l'institution de référence en formation à la conduite au Mali depuis +27 ans. "
            "Basée à Baco-Djicoroni, Bamako (près de la station Total) avec une agence à Sikasso. "
            "Devise : « Pour mieux conduire, mieux apprendre. » "
            "Chiffres clés : +30 000 permis délivrés · +98% taux de réussite · +150 leçons pratiques/mois. "
            "Services : Permis B (120 000 F CFA), C (150 000 F CFA), A (75 000 F CFA), simulateur, perfectionnement. "
            "Contact : +223 76393170 | infos@autoecoletigana.com | client.autoecoletigana.com/go"
        ),
        "pourquoi": "Le Brand Profile est la mémoire principale de Blaze. Sans les chiffres clés et les tarifs exacts, Blaze invente ou généralise.",
    },
    {
        "section": "Brand Kit > Source Materials",
        "priorite": 1,
        "champ": "Upload Brand Guide PDF",
        "statut_actuel": "vide",
        "valeur_recommandee": "Uploader le fichier AET_Brand_Guide_Blaze.md (généré par cet outil) converti en PDF",
        "pourquoi": "Source Materials permet à Blaze d'apprendre en profondeur : tarifs exacts, catégories de permis, services, partenaires.",
    },
    {
        "section": "Content Preferences > General",
        "priorite": 2,
        "champ": "Market Location",
        "statut_actuel": "inconnu",
        "valeur_recommandee": "Afrique de l'ouest (Mali, Niger, Burkina Faso)",
        "pourquoi": "AET forme des conducteurs au-delà du Mali — ancrer le contenu dans le contexte ouest-africain.",
    },
    {
        "section": "Content Preferences > General",
        "priorite": 2,
        "champ": "Target Audience",
        "statut_actuel": "inconnu",
        "valeur_recommandee": "Young West Africans aged 18-35 in Mali, Niger and Burkina Faso seeking their first driver's license; professionals wanting to upgrade their license category; parents considering driving school for their children",
        "pourquoi": "Audience précise couvrant l'Afrique de l'ouest = contenu plus pertinent et plus convertissant.",
    },
    {
        "section": "Content Preferences > General",
        "priorite": 2,
        "champ": "People Appearing in Content",
        "statut_actuel": "inconnu",
        "valeur_recommandee": "Diverse West African community, mixed gender, ages 18-45, dressed in contemporary and traditional West African clothing. Group shots in classroom and vehicle settings.",
        "pourquoi": "Blaze utilisera des visuels cohérents avec la réalité visuelle d'AET et de son audience régionale.",
    },
    {
        "section": "Content Preferences > Social Media",
        "priorite": 2,
        "champ": "Default Call to Action",
        "statut_actuel": "inconnu",
        "valeur_recommandee": "Inscrivez-vous : client.autoecoletigana.com/go | +223 76393170 | infos@autoecoletigana.com",
        "pourquoi": "Le CTA doit pointer vers le portail d'inscription en ligne et les contacts officiels AET.",
    },
    {
        "section": "Content Preferences > Social Media",
        "priorite": 2,
        "champ": "Hashtags",
        "statut_actuel": "inconnu",
        "valeur_recommandee": "#AutoEcoleTigana #AET #PermisConduire #PermisB #Bamako #Mali #Niger #BurkinaFaso #SecuriteRoutiere #CodeDeLaRoute #AfriqueOuest",
        "pourquoi": "Hashtags couvrant l'Afrique de l'ouest pour maximiser la portée régionale.",
    },
    {
        "section": "Brand Kit > Styles & Voice > Brand Voice > Language",
        "priorite": 3,
        "champ": "Language Rules",
        "statut_actuel": "Use french for all caption (présent)",
        "valeur_recommandee": (
            "Write ALL captions and social content in French. "
            "Reference Malian context (Bamako, Sikasso, routes maliennes) when relevant. "
            "Incorporate driving education terminology: permis B/C/A, code de la route, moniteur, auto-école. "
            "Always end posts with: client.autoecoletigana.com/go or '+223 76393170'. "
            "Never write in English for captions."
        ),
        "pourquoi": "Renforcer la règle langue + ajouter le contexte malien et les terminologies spécifiques.",
    },
    {
        "section": "Brand Kit > Styles & Voice > Brand Styles > Visual Identity",
        "priorite": 3,
        "champ": "Visual Identity Description",
        "statut_actuel": "Présent mais sans mention Malien/Bamako",
        "valeur_recommandee": (
            "Warm, welcoming photographic style centered on group imagery and candid moments of Malian students "
            "learning to drive in Bamako. Subjects are predominantly Malian, diverse, mixed gender, ages 18-45, "
            "dressed in contemporary and traditional Malian clothing. Mid-range group shots, soft natural lighting, "
            "warm skin tones. AET logo always visible. Colors: deep crimson red, dark navy, off-white, black. "
            "Settings: AET classrooms, Bamako streets, AET vehicles."
        ),
        "pourquoi": "Ancrer les visuels dans la réalité malienne d'AET pour des images plus authentiques.",
    },
    {
        "section": "Brand Kit > Media Library",
        "priorite": 4,
        "champ": "Photo Library",
        "statut_actuel": "À vérifier",
        "valeur_recommandee": "Uploader minimum 20 photos réelles : élèves en salle de cours, moniteurs, véhicules AET, simulateur, remises de permis, équipe AET, locaux Bamako",
        "pourquoi": "Blaze utilise les photos uploadées pour générer du contenu visuellement authentique.",
    },
]


def run_audit() -> dict:
    """Génère l'audit complet et l'affiche de manière structurée."""
    import sys
    if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    print("\n" + "="*60)
    print("AUDIT BLAZE AET -- Rapport de configuration")
    print(f"Date : {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("="*60)

    by_priority = {}
    for item in BLAZE_AUDIT_CHECKLIST:
        p = item["priorite"]
        by_priority.setdefault(p, []).append(item)

    priority_labels = {1: "CRITIQUE", 2: "IMPORTANT", 3: "RECOMMANDE", 4: "OPTIONNEL"}
    priority_icons = {1: "[!]", 2: "[~]", 3: "[?]", 4: "[+]"}

    results = []
    for p in sorted(by_priority.keys()):
        label = priority_labels.get(p, f"P{p}")
        icon = priority_icons.get(p, "•")
        print(f"\n" + "-"*60)
        print(f"{icon} PRIORITE {p} -- {label}")
        print("-"*60)
        for item in by_priority[p]:
            print(f"\n  > {item['section']}")
            print(f"   Champ    : {item['champ']}")
            print(f"   Actuel   : {item['statut_actuel']}")
            val = item['valeur_recommandee']
            print(f"   Mettre   : {val[:120]}{'...' if len(val) > 120 else ''}")
            print(f"   Pourquoi : {item['pourquoi']}")
            results.append({**item, "label_priorite": label})

    return results


def generate_brand_guide() -> str:
    """Génère le Brand Guide complet à uploader dans Blaze Source Materials."""
    b = AET_BRAND_REFERENCE
    guide = f"""# Auto École Tigana (AET) — Brand Guide for Blaze.ai
## Source Material — À uploader dans Brand Kit > Source Materials
Généré le : {datetime.now().strftime('%Y-%m-%d')}

---

## 1. IDENTITÉ DE MARQUE

**Nom officiel :** {b['identite']['nom_officiel']}
**Acronyme :** {b['identite']['acronyme']}
**Devise :** « {b['identite']['devise']} »
**Accroche web :** « {b['identite']['accroche']} »
**Positionnement :** {b['identite']['positionnement']}

---

## 2. CONTACTS ET PRÉSENCE

- **Téléphone :** {b['contacts']['telephone']}
- **Email :** {b['contacts']['email']}
- **Site web :** {b['contacts']['site_web']}
- **Facebook :** {b['contacts']['facebook']}
- **Instagram :** {b['contacts']['instagram']}
- **Siège :** {b['contacts']['siege']}
- **Agence 2 :** {b['contacts']['agence2']}

---

## 3. CHIFFRES CLÉS (À VALORISER DANS TOUT CONTENU)

- **{b['chiffres_cles']['experience']}** d'expérience dans la formation à la conduite au Mali
- **{b['chiffres_cles']['permis_delivres']}** permis délivrés depuis la création
- **{b['chiffres_cles']['taux_reussite']}** taux de réussite aux examens
- **{b['chiffres_cles']['lecons_par_mois']}** dispensées chaque mois
- {b['chiffres_cles']['fondation']}

---

## 4. TARIFS ET SERVICES (NE JAMAIS INVENTER — UTILISER UNIQUEMENT CES CHIFFRES)

| Formation | Tarif | Durée | Détails |
|---|---|---|---|
| Permis B (Véhicules légers) | {b['services']['permis_b']['tarif']} | {b['services']['permis_b']['duree']} | {b['services']['permis_b']['details']} |
| Permis C (Poids lourds) | {b['services']['permis_c']['tarif']} | {b['services']['permis_c']['duree']} | {b['services']['permis_c']['details']} |
| Permis A (Motos) | {b['services']['permis_a']['tarif']} | {b['services']['permis_a']['duree']} | {b['services']['permis_a']['details']} |
| Permis D (Transport commun) | {b['services']['permis_d']['tarif']} | — | {b['services']['permis_d']['details']} |
| Permis E (Semi-remorque) | {b['services']['permis_e']['tarif']} | — | {b['services']['permis_e']['details']} |
| Perfectionnement (10 jours) | {b['services']['perfectionnement']['tarif']} | {b['services']['perfectionnement']['duree']} | Amélioration conduite |
| Simulateur (séance 30 min) | {b['services']['simulateur']['tarif']} | — | {b['services']['simulateur']['details']} |

**Réduction :** {b['services']['reduction_etudiants']}

**RÈGLE ABSOLUE :** Ne jamais mentionner un tarif différent de ceux listés ci-dessus. En cas de doute, ne pas mentionner de tarif et rediriger vers client.autoecoletigana.com/go ou +223 76393170.

---

## 5. AUDIENCE CIBLE

- **Primaire :** {b['audience']['primaire']}
- **Secondaire :** {b['audience']['secondaire']}
- **Tertiaire :** {b['audience']['tertiaire']}
- **Géographie :** {b['audience']['geographie']}

---

## 6. RÈGLES DE CONTENU PAR PLATEFORME

### Facebook
- Longueur : 150-300 mots
- Langue : Français uniquement
- Ton : Informatif et communautaire
- Toujours inclure : client.autoecoletigana.com/go ou +223 76393170
- Hashtags : 3-5 maximum

### Instagram
- Longueur : 50-150 mots (caption courte + accroche forte)
- Langue : Français uniquement
- Emojis : 5-10 (pertinents)
- Hashtags : 10-15 (mélange brandés + génériques)
- Premier mot/ligne = accroche percutante

### TikTok
- Caption : 30-80 mots, punchy
- Langue : Français
- Hashtags : 5-8 trending + brandés
- Axé sur l'émotion et l'identification

### Blog
- Langue : Français
- Longueur : 600-1200 mots
- Structure : H2/H3 clairs, listes, CTA final vers inscription

---

## 7. HASHTAGS OFFICIELS AET

**Hashtags de marque :** #AutoEcoleTigana #AET #TiganaDrive
**Hashtags service :** #PermisConduire #PermisB #PermisC #CodeDeLaRoute #ApprendreAConduire
**Hashtags locaux :** #Bamako #Mali #MaliDrive #BamakoLife #Sikasso
**Hashtags thématiques :** #SecuriteRoutiere #FormationConduite #RouleEnSecurite

---

## 8. CALLS TO ACTION OFFICIELS

**CTA Principal :** « Inscrivez-vous : client.autoecoletigana.com/go »
**CTA Téléphone :** « Appelez-nous : +223 76393170 »
**CTA Email :** « Contactez-nous : infos@autoecoletigana.com »
**CTA Réseau :** « Rejoignez la famille AET »
**CTA Urgence :** « Places limitées — Inscrivez-vous maintenant : client.autoecoletigana.com/go »

---

## 9. FORMULES À UTILISER / ÉVITER

### Formules à utiliser
- « Pour mieux conduire, mieux apprendre. »
- « Bienvenue au royaume de la conduite »
- « Plus qu'une école, une famille »
- « Leader de la formation au Mali depuis +27 ans »
- « +30 000 conducteurs nous font confiance »
- « Conduire, c'est une responsabilité — formez-vous chez les meilleurs »

### Formules à ÉVITER absolument
- « 100% de réussite garanti » (jamais de garantie absolue)
- « Nous sommes les meilleurs » (trop agressif — préférer les chiffres)
- « Pas cher / Économique » (sous-valorise la marque)
- Tout tarif non listé dans la section 4
- Contenu en anglais pour les captions

---

## 10. PARTENAIRES INSTITUTIONNELS (À MENTIONNER AVEC PRÉCAUTION)

{chr(10).join('- ' + p for p in b['partenaires'])}

---

## 11. TÉMOIGNAGES TYPE (UTILISER COMME INSPIRATION)

> « Professionnel, ponctuel, à l'écoute. Tigana n'est pas juste une auto-école, c'est un accompagnement complet. »
> — Ismaël Traoré, Sikasso, Permis C (2023)

> « Le simulateur m'a sauvé ! J'ai pu pratiquer dans un environnement sûr avant d'affronter la vraie route. »
> — Aminata Keïta, Bamako, Permis B (2024)

---

*Document généré automatiquement par l'Agent Image AET — À re-générer si les tarifs ou services changent.*
"""
    return guide


def main():
    parser = argparse.ArgumentParser(description="Optimiseur de configuration Blaze pour AET")
    parser.add_argument(
        "--action",
        required=True,
        choices=["audit", "generate_brand_guide", "full"],
        help="Action à effectuer",
    )
    args = parser.parse_args()

    tmp_dir = Path(__file__).parent.parent / ".tmp"
    tmp_dir.mkdir(exist_ok=True)

    if args.action in ("audit", "full"):
        results = run_audit()
        audit_file = tmp_dir / "blaze_audit.json"
        with open(audit_file, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\n\n[blaze_optimizer] ✅ Audit sauvegardé → {audit_file}")

    if args.action in ("generate_brand_guide", "full"):
        guide = generate_brand_guide()
        guide_file = tmp_dir / "AET_Brand_Guide_Blaze.md"
        with open(guide_file, "w", encoding="utf-8") as f:
            f.write(guide)
        print(f"\n[blaze_optimizer] ✅ Brand Guide généré → {guide_file}")
        print("\n📋 PROCHAINE ÉTAPE :")
        print("   1. Ouvrir Blaze > Brand Kit > Source Materials")
        print("   2. Convertir AET_Brand_Guide_Blaze.md en PDF (ou uploader le .md)")
        print("   3. Cliquer sur 'Upload' et sélectionner le fichier")
        print("   4. Attendre que Blaze analyse le document (~2 min)")

    print("\n✅ Terminé.")


if __name__ == "__main__":
    main()
