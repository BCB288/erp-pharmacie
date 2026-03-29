# Sous-workflow : Veille & Réponses
**Version :** 1.0 — 2026-03-28
**Objectif :** Surveiller les mentions AET et rédiger des réponses alignées avec la marque.

---

## Canaux à surveiller

| Canal | Type de contenu | Fréquence de veille |
|---|---|---|
| Facebook (`/AUTOECOLETIGANA1/`) | Commentaires, avis, mentions | Quotidien |
| Instagram (`@autoecoletigana1`) | Commentaires, DM, stories | Quotidien |
| TikTok | Commentaires, partages | Quotidien |
| Google Business | Avis clients | Hebdomadaire |

---

## Catégories de messages entrants

### 1. Demande d'information
**Exemples :** "C'est combien le permis B ?", "Comment s'inscrire ?"
**Réponse type :** Répondre avec les infos exactes + CTA téléphone/email
**Délai cible :** < 2h


### 2. Commentaire positif / Témoignage
**Exemples :** "Super école !", "J'ai eu mon permis grâce à vous"
**Réponse type :** Remercier chaleureusement, valoriser l'élève, inviter à partager
**Délai cible :** < 4h

### 3. Plainte ou avis négatif
**Exemples :** "J'attends depuis une semaine", "Le moniteur était en retard"
**Réponse type :** Reconnaître, s'excuser sans admettre de faute, proposer contact privé
**Délai cible :** < 1h (priorité haute)

### 4. Spam ou contenu inapproprié
**Action :** Masquer ou signaler. Ne pas répondre.

### 5. Demande de partenariat / presse
**Action :** Rediriger vers `infos@autoecoletigana.com`

---

## Étapes d'exécution

### Étape 1 — Collecter les interactions
```bash
python tools/veille.py --canal "<facebook|instagram|tiktok>" --periode "24h"
```
Output : `.tmp/veille_<date>.json` avec liste des interactions non traitées.

### Étape 2 — Catégoriser
L'agent analyse chaque interaction et lui assigne une catégorie (1-5 ci-dessus).

### Étape 3 — Générer les réponses
Pour chaque interaction catégorisée :
```bash
python tools/post_generator.py \
  --type "reponse" \
  --categorie "<categorie>" \
  --message_original "<texte>"
```

### Étape 4 — Validation humaine (obligatoire pour cat. 3)
- Cat. 1, 2, 4, 5 : L'agent peut soumettre la réponse directement dans Notion pour validation légère
- **Cat. 3 (plainte) : Toujours soumettre à l'utilisateur avant de publier**

### Étape 5 — Logger dans Notion
```bash
python tools/notion_push.py \
  --type "veille" \
  --input ".tmp/veille_<date>.json"
```

---

## Règles de réponse

1. **Jamais de promesse en public** — rediriger vers le contact privé pour les engagements
2. **Toujours signer** avec le nom de l'école ou "L'équipe AET"
3. **Éviter les réponses génériques** — personnaliser avec le prénom si disponible
4. **Pas de débat public** — si le commentaire devient agressif, couper court poliment
5. **Collecter les témoignages positifs** — les transformer en futurs posts (avec accord)

---

## Modèles de réponse

### Demande d'info
> Bonjour [Prénom] ! Pour le Permis B, la formation complète est à **120 000 F CFA** (inscription + examen inclus). Inscrivez-vous en ligne : **client.autoecoletigana.com/go** ou appelez le **+223 76393170**. On vous attend ! 🚗 — *L'équipe AET*

### Témoignage positif
> Félicitations [Prénom] ! 🎉 Vous faites maintenant partie de nos +30 000 diplômés. Merci pour votre confiance — conduisez bien et en toute sécurité ! — *L'équipe AET*

### Plainte
> Bonjour [Prénom], nous sommes désolés pour cette situation. Votre satisfaction est notre priorité. Contactez-nous directement au **+223 76393170** ou via **infos@autoecoletigana.com** pour qu'on règle ça rapidement. Merci pour votre patience. — *L'équipe AET*
