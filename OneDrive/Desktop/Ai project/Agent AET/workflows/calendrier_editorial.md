# Sous-workflow : Calendrier éditorial
**Version :** 1.0 — 2026-03-28
**Objectif :** Planifier et organiser les publications AET sur un mois glissant.

---

## Inputs requis

| Input | Description | Exemple |
|---|---|---|
| `mois` | Mois à planifier | `2026-04` |
| `frequence_fb` | Posts Facebook/semaine | `3` |
| `frequence_ig` | Posts Instagram/semaine | `4` |
| `frequence_tt` | Posts TikTok/semaine | `2` |
| `themes_prioritaires` | Sujets à couvrir ce mois | "Promo mai, Fête du travail, Témoignages" |

---

## Cadre de contenu AET

### Mix de contenu recommandé (règle 4-1-1)
- **4 posts éducatifs/utiles** : Code de la route, sécurité, conseils conduite
- **1 post promotionnel** : Offres, tarifs, inscriptions
- **1 post social/communauté** : Témoignages, réussites élèves, coulisses

### Thèmes récurrents à intégrer
| Thème | Fréquence | Exemple de contenu |
|---|---|---|
| Astuce conduite | Hebdomadaire | "3 erreurs à éviter au rond-point" |
| Réussite élève | Bi-mensuel | Témoignage + photo permis |
| Rappel sécurité | Mensuel | "Alcool au volant : les chiffres qui font peur" |
| Promo / Offre | Mensuel | "Inscriptions ouvertes — Permis B à 120 000 F CFA" |
| Chiffre AET | Mensuel | "+30 000 permis délivrés. Ton tour ?" |

---

## Étapes d'exécution

### Étape 1 — Lister les événements du mois
Identifier les dates importantes :
- Fêtes nationales maliennes
- Événements sécurité routière (ANASER)
- Dates de sessions d'examen internes
- Jours fériés (éviter les posts promotionnels)

### Étape 2 — Générer le plan de contenu
Créer un fichier `.tmp/calendrier_<mois>.json` avec la structure :
```json
{
  "mois": "2026-04",
  "posts": [
    {
      "date": "2026-04-01",
      "plateforme": "instagram",
      "sujet": "Astuce conduite — démarrage en côte",
      "objectif": "éduquer",
      "statut": "à créer"
    }
  ]
}
```

### Étape 3 — Pousser le calendrier dans Notion
```bash
python tools/notion_push.py \
  --type "calendrier" \
  --input ".tmp/calendrier_<mois>.json"
```

### Étape 4 — Déclencher la création des posts (optionnel)
Pour chaque entrée du calendrier, lancer `creer_post.md` automatiquement ou à la demande.

---

## Output attendu dans Notion

Base de données **"Calendrier Éditorial AET"** mise à jour avec :
- Une ligne par post planifié
- Colonnes : Date · Plateforme · Sujet · Statut · Contenu · Assigné à

---

## Règles de planification

1. Ne pas publier plus de 2 posts/jour tous canaux confondus
2. Espacer les posts promo d'au moins 7 jours
3. Le vendredi = contenu engagement/communauté (plus forte audience)
4. Le lundi matin = contenu motivationnel (début de semaine)
5. Éviter les publications pendant les fêtes religieuses au Mali (Ramadan, Tabaski)
