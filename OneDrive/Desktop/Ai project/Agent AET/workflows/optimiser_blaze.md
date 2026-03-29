# Sous-workflow : Optimisation Blaze.ai
**Version :** 1.0 — 2026-03-28
**Objectif :** Auditer la configuration Blaze AET et fournir les corrections exactes à appliquer manuellement dans l'interface Blaze (Brand Kit, Content Preferences, Source Materials, Brand Profile).

---

## Contexte

Blaze.ai est l'outil principal de création de contenu AET. Il génère des posts, reels, blogs, stories automatiquement selon son Brand Kit. Plus le Brand Kit est précis, plus les outputs sont fidèles à AET.

### Paramètres configurables dans Blaze

| Section | Sous-section | Rôle |
|---|---|---|
| **Brand Kit > Media Library** | Logos, photos, vidéos | Visuels utilisés dans le contenu généré |
| **Brand Kit > Styles & Voice > Brand Styles** | Visual Identity Description | Style photo, composition, éclairage |
| **Brand Kit > Styles & Voice > Brand Voice** | Purpose, Audience, Tone, Emotions, Character, Syntax, Language | Voix et personnalité de marque |
| **Brand Kit > Brand Profile** | Description de l'entreprise | Résumé business pour guider l'IA |
| **Brand Kit > Source Materials** | PDFs, guides, fiches produit | Documentation que Blaze étudie en profondeur |
| **Content Preferences > General** | Marché, audience, personnes | Contexte géographique et démographique |
| **Content Preferences > Image & Video** | Composition, type de visuels | Format des médias générés |
| **Content Preferences > Social Media** | Logo, CTA, hashtags | Paramètres spécifiques aux posts |
| **Content Preferences > Blog & Email** | Liens, CTA, mise en forme | Paramètres éditoriaux long-form |

---

## Étapes d'exécution

### Étape 1 — Générer l'audit complet
```bash
python tools/blaze_optimizer.py --action audit
```
Output : `.tmp/blaze_audit.json` — liste de tous les champs avec valeur actuelle (si fournie), valeur recommandée AET, et priorité de correction.

### Étape 2 — Générer le Brand Guide (Source Material)
```bash
python tools/blaze_optimizer.py --action generate_brand_guide
```
Output : `.tmp/AET_Brand_Guide_Blaze.md` — document complet à uploader dans Blaze > Brand Kit > Source Materials.

### Étape 3 — Présenter les corrections à l'utilisateur
Afficher un rapport structuré par section Blaze avec :
- ✅ Champs déjà corrects
- ⚠️ Champs à ajuster
- ❌ Champs manquants ou incorrects

### Étape 4 — L'utilisateur applique les corrections dans Blaze
Chaque correction est présentée avec :
1. Où aller dans Blaze (chemin exact)
2. Quoi mettre (texte exact, copier-coller ready)
3. Pourquoi (justification brand AET)

---

## Audit de référence : État actuel vs Idéal

### Brand Voice — État actuel (lu dans les screenshots)

| Champ | Valeur actuelle | Statut |
|---|---|---|
| Tone | Encouraging and supportive · Informative yet approachable · Confident and knowledgeable | ✅ Correct |
| Emotions | Empowerment through education · Trust and reliability · Community and belonging | ✅ Correct |
| Character | Mentor · Family-like figure · Reliable partner | ✅ Correct |
| Syntax | ~15 words · Bullet points · Direct CTAs | ✅ Correct |
| Language | Simple · Driving terminology · Informal+pro · **French for captions** | ⚠️ Incomplet — manque les spécificités Mali/Bamako |

### Points à corriger identifiés

**Brand Profile (critique)**
- Manque : +27 ans, +30 000 permis, +98% réussite, Bamako (Baco-Djicoroni / station Total), Sikasso
- Manque : la devise officielle « Pour mieux conduire, mieux apprendre »
- Manque : le numéro de téléphone et l'email dans le profil

**Source Materials (critique)**
- Aucun document uploadé → Blaze ne connaît pas les tarifs exacts, les catégories de permis, les services détaillés
- Action : uploader le Brand Guide généré par `blaze_optimizer.py`

**Content Preferences > General (important)**
- Market location : doit être "Mali, Bamako" (pas générique)
- Target audience : doit inclure "young Malians 18+, professionals, parents in Bamako and Sikasso"
- People in content : "diverse Malian community, mixed gender, ages 18-45"

**Content Preferences > Social Media (important)**
- Default CTA : "Inscrivez-vous au 76 39 31 70 | autoecoletigana1@gmail.com"
- Hashtags : #AutoEcoleTigana #AET #PermisConduire #Bamako #MaliDrive #SecuriteRoutiere #CodeDeLaRoute

**Brand Styles > Visual Identity (mineur)**
- Ajouter mention explicite : "subjects are predominantly Malian, dressed in contemporary and traditional Malian clothing"
- Ajouter : "AET logo always visible in the corner"

---

## Règles pour appliquer les corrections

1. **Ne jamais modifier les éléments déjà corrects** (Tone, Emotions, Character, Syntax — ils sont bons)
2. **Priorité 1** : Source Materials (upload du brand guide) — impact immédiat sur tous les outputs
3. **Priorité 2** : Brand Profile + Content Preferences General
4. **Priorité 3** : Social Media defaults (CTA, hashtags)
5. **Priorité 4** : Visual Identity Description refinements

---

## Maintenance

Relancer cet audit :
- Après chaque changement majeur dans l'offre AET (nouveaux tarifs, nouvelles catégories)
- Si les outputs Blaze dérivent du brand (ton incorrect, infos fausses)
- Tous les 3 mois pour maintenir la précision
