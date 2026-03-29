# Sous-workflow : Créer un post social media
**Version :** 1.0 — 2026-03-28
**Objectif :** Générer un post aligné avec le brand kit AET pour Facebook, Instagram ou TikTok.

---

## Inputs requis

| Input | Description | Exemple |
|---|---|---|
| `plateforme` | Canal cible | `facebook`, `instagram`, `tiktok` |
| `sujet` | Thème du post | "Promo permis B", "Témoignage élève", "Sécurité routière" |
| `objectif` | Ce que le post doit accomplir | "attirer de nouveaux inscrits", "fidéliser", "éduquer" |
| `ton` | Registre voulu | `motivant`, `informatif`, `humoristique`, `émotionnel` |
| `date_publication` | Date prévue (YYYY-MM-DD) | `2026-04-05` |

Si un input manque, demander à l'utilisateur avant de continuer.

---

## Contraintes par plateforme

| Plateforme | Longueur max | Format | Emojis | Hashtags |
|---|---|---|---|---|
| Facebook | 400 mots | Texte long OK | Modéré (3-5) | 3-5 pertinents |
| Instagram | 150 mots | Texte court + accroche forte | Abondant (5-10) | 10-15 |
| TikTok | 80 mots (caption) | Très court, punchy | Abondant | 5-8 tendance |

---

## Étapes d'exécution

### Étape 1 — Générer le contenu brut
Exécuter :
```bash
python tools/post_generator.py \
  --plateforme "<plateforme>" \
  --sujet "<sujet>" \
  --objectif "<objectif>" \
  --ton "<ton>"
```
Output : texte brut du post dans `.tmp/post_draft.json`

### Étape 2 — Vérifier la cohérence de marque
Exécuter immédiatement après :
```bash
python tools/brand_checker.py --input ".tmp/post_draft.json"
```
- Score ≥ 80/100 : continuer
- Score < 80 : corriger selon les suggestions et relancer l'étape 1

### Étape 3 — Pousser vers Notion
```bash
python tools/notion_push.py \
  --type "post" \
  --input ".tmp/post_draft.json" \
  --date "<date_publication>" \
  --plateforme "<plateforme>"
```
Output : URL Notion de la fiche post créée.

---

## Output attendu dans Notion

Chaque post crée une entrée dans la base **"Calendrier Éditorial AET"** avec :
- Titre : `[Plateforme] Sujet — Date`
- Statut : `Brouillon`
- Contenu du post
- Hashtags
- Objectif
- Lien vers la page Notion du post

---

## Cas particuliers

- **Post urgent (< 24h)** : Sauter l'étape calendrier, pousser directement en statut `Urgent`
- **Série de posts** : Boucler les étapes 1-3 pour chaque post, puis créer un regroupement dans Notion
- **Contenu sensible** (prix, règles légales) : Toujours faire valider par l'utilisateur avant de marquer `Prêt`
