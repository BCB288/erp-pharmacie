# Sous-workflow : Vérification cohérence de marque
**Version :** 1.0 — 2026-03-28
**Objectif :** S'assurer que tout contenu produit respecte l'identité de marque AET avant publication.

---

## Critères de validation (100 points total)

### A. Ton & Voix (30 pts)
| Critère | Points | Vérification |
|---|---|---|
| Ton professionnel mais accessible | 10 | Pas trop formel ni trop familier |
| Bienveillant et rassurant | 10 | Pas de formulations anxiogènes |
| Orienté pédagogie | 10 | Contenu qui apprend quelque chose |

### B. Messages clés (30 pts)
| Critère | Points | Vérification |
|---|---|---|
| Mise en avant de l'expérience / chiffres | 10 | Au moins un chiffre clé si pertinent |
| Lien avec la sécurité routière | 10 | Valeur sécurité présente ou implicite |
| Invitation à l'action claire | 10 | CTA présent (s'inscrire, nous contacter, etc.) |

### C. Identité visuelle textuelle (20 pts)
| Critère | Points | Vérification |
|---|---|---|
| Nom AET ou "Auto École Tigana" mentionné | 10 | Pas de référence vague |
| Devise ou accroche intégrée (si post important) | 10 | Facultatif pour micro-posts |

### D. Conformité (20 pts)
| Critère | Points | Vérification |
|---|---|---|
| Pas de promesse impossible (ex: "100% de réussite garanti") | 10 | Vérifier les superlatifs absolus |
| Pas d'erreur factuelle (tarifs, catégories, durées) | 10 | Croiser avec le Portfolio AET |

---

## Seuils de validation

| Score | Décision |
|---|---|
| ≥ 90 | ✅ Approuvé — publier |
| 80-89 | ⚠️ Approuvé avec ajustements mineurs |
| 70-79 | 🔄 Révision requise — corriger et soumettre à nouveau |
| < 70 | ❌ Rejeté — réécrire depuis le début |

---

## Étapes d'exécution

### Étape 1 — Analyser le contenu
```bash
python tools/brand_checker.py --input "<fichier_ou_texte>"
```
Output : score + liste des points à corriger dans `.tmp/brand_check_result.json`

### Étape 2 — Interpréter les résultats
- Lire les suggestions de correction
- Appliquer les corrections dans le draft
- Si score < 70 : recommencer la génération dans `creer_post.md`

### Étape 3 — Valider
Si score ≥ 80, marquer le post comme `Prêt` dans Notion.

---

## Exemples de corrections type

| Problème détecté | Correction |
|---|---|
| "Venez chez nous" | → "Rejoignez la famille AET" |
| "Nous sommes les meilleurs" | → "Leader de la formation au Mali depuis +27 ans" |
| Pas de CTA | → Ajouter "Inscrivez-vous dès aujourd'hui : 76 39 31 70" |
| Ton trop froid/corporatif | → Ajouter une touche humaine (témoignage, question au lecteur) |
| Prix incorrects | → Vérifier dans le Portfolio AET Notion |
