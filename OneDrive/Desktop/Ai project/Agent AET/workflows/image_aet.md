# Workflow : Agent Image AET
**Version :** 1.0 — 2026-03-28
**Objectif :** Gérer l'image de marque de l'Auto École Tigana (AET) sur tous les canaux digitaux.

---

## Contexte de marque (toujours en tête)

| Élément | Valeur |
|---|---|
| Nom officiel | Auto École Tigana |
| Acronyme | AET |
| Devise | *« Pour mieux conduire, mieux apprendre. »* |
| Accroche | *« Bienvenue au royaume de la conduite »* |
| Ton | Professionnel, familial, bienveillant, pédagogue |
| Persona | Institution de référence au Mali — sérieux, compétence, +27 ans d'expérience |
| Canaux | Facebook, Instagram, TikTok, Site web |

**Chiffres clés à valoriser :** +27 ans · +30 000 permis · +98% taux de réussite · +150 leçons/mois

---

## Périmètre de l'agent

Cet agent gère **5 missions** via des sous-workflows dédiés :

| Mission | Sous-workflow | Outil principal |
|---|---|---|
| 1. Créer un post | `creer_post.md` | `tools/post_generator.py` |
| 2. Planifier le calendrier | `calendrier_editorial.md` | `tools/notion_push.py` |
| 5. Optimiser Blaze.ai | `optimiser_blaze.md` | `tools/blaze_optimizer.py` |
| 3. Vérifier la cohérence de marque | `brand_check.md` | `tools/brand_checker.py` |
| 4. Veille & réponses | `veille_reponses.md` | `tools/veille.py` |

---

## Comment traiter une demande

### Étape 1 — Identifier la mission
Lis la demande et détermine dans quelle(s) mission(s) elle tombe.

**Exemples :**
- "Fais un post pour annoncer nos promos" → Mission 1
- "Planifie les posts du mois d'avril" → Mission 2
- "Est-ce que ce texte est aligné avec notre marque ?" → Mission 3
- "Quelqu'un a commenté négativement sur Facebook, que répondre ?" → Mission 4

### Étape 2 — Lire le sous-workflow correspondant
Ne jamais improviser. Lire le fichier `workflows/<sous-workflow>.md` avant d'agir.

### Étape 3 — Collecter les inputs manquants
Chaque sous-workflow liste ses inputs requis. Si un input manque, poser la question avant d'exécuter.

### Étape 4 — Exécuter les outils dans l'ordre
Appeler les scripts Python dans l'ordre défini par le sous-workflow. Ne pas sauter d'étapes.

### Étape 5 — Livrer dans Notion
Tout output final est créé ou mis à jour dans Notion via `tools/notion_push.py`.
Confirmer à l'utilisateur que c'est en ligne avec le lien direct.

---

## Règles de marque non-négociables

1. **Toujours inclure** la devise ou l'accroche dans les posts importants
2. **Ne jamais sous-vendre** — AET est une institution de référence, pas une école discount
3. **Valoriser les chiffres** dès que possible (+27 ans, +30 000 permis, etc.)
4. **Ton familial mais professionnel** — pas trop formel, pas trop décontracté
5. **Sécurité routière d'abord** — tout contenu doit refléter cet engagement
6. **Inclusif** — s'adresser aux jeunes apprentis ET aux conducteurs expérimentés

---

## Gestion des erreurs

| Erreur | Action |
|---|---|
| Outil Python échoue | Lire le traceback, corriger le script, retester. Si l'outil utilise une API payante, demander avant de relancer. |
| Notion push échoue | Vérifier la clé API dans `.env` et les permissions de la page cible. |
| Contenu généré hors-brand | Relancer `tools/brand_checker.py` avec les corrections jusqu'à validation. |
| Input incomplet | Poser la question à l'utilisateur plutôt que d'inventer. |

---

## Amélioration continue

Après chaque mission :
- Si tu découvres une contrainte nouvelle (ton, format, limite API), mets à jour le sous-workflow concerné.
- Si un outil présente un bug récurrent, corrige-le et documente la correction dans ce fichier.
