# Configuration de TiganaDrive Manager

## Étape 1 : Configuration Supabase

### Obtenir vos identifiants Supabase

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Sélectionnez votre projet ou créez-en un nouveau
3. Allez dans **Settings** > **API**
4. Copiez :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (une longue chaîne de caractères)

### Configurer l'application

Ouvrez le fichier `lib/core/constants/app_constants.dart` et remplacez les valeurs :

```dart
// AVANT
static const String supabaseUrl = 'YOUR_SUPABASE_URL';
static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// APRÈS (avec vos vraies valeurs)
static const String supabaseUrl = 'https://xxxxx.supabase.co';
static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## Étape 2 : Créer un Utilisateur de Test

Dans le dashboard Supabase :

1. Allez dans **Authentication** > **Users**
2. Cliquez sur **Add user** > **Create new user**
3. Entrez :
   - Email : `admin@tiganadrive.com` (ou votre email)
   - Password : `Test123456` (changez-le après)
4. Cliquez sur **Create user**

## Étape 3 : Ajouter une Agence de Test

Dans le dashboard Supabase :

1. Allez dans **Table Editor** > **agences**
2. Cliquez sur **Insert** > **Insert row**
3. Remplissez :
   - `nom` : "Agence Principale"
   - `adresse` : "123 Rue de Test"
   - `telephone` : "01 23 45 67 89"
   - `email` : "contact@tiganadrive.com"
4. Cliquez sur **Save**

## Étape 4 : Lancer l'Application

```bash
# Installer les dépendances
flutter pub get

# Lancer sur Chrome (Web)
flutter run -d chrome

# OU sur Windows
flutter run -d windows
```

## Étape 5 : Se Connecter

Utilisez les identifiants créés à l'étape 2 :
- Email : `admin@tiganadrive.com`
- Mot de passe : `Test123456`

## Données de Test (Optionnel)

Pour tester l'application avec des données, vous pouvez ajouter manuellement dans Supabase :

### Ajouter un Élève

Table `eleves` :
```
nom: Diop
prenom: Moussa
telephone: 06 12 34 56 78
email: moussa.diop@example.com
agence_id: [ID de votre agence]
statut: inscrit
```

### Ajouter un Contrat

Table `contrats` :
```
eleve_id: [ID de l'élève créé]
agence_id: [ID de votre agence]
categorie_permis: B
type_formation: classique
nombre_heures_prevues: 20
prix_forfait: 800000
statut: actif
```

### Ajouter un Paiement

Table `paiements` :
```
contrat_id: [ID du contrat créé]
agence_id: [ID de votre agence]
montant: 200000
mode_paiement: especes
date_paiement: [Date actuelle]
```

## Troubleshooting

### "Supabase n'a pas été initialisé"
- Vérifiez que vous avez bien modifié `app_constants.dart`
- Relancez l'application avec `flutter run`

### "Invalid login credentials"
- Vérifiez l'email et le mot de passe
- Assurez-vous que l'utilisateur existe dans Supabase Auth

### Aucune agence ne s'affiche
- Vérifiez que vous avez créé au moins une agence dans la table `agences`
- Vérifiez les politiques RLS (Row Level Security) dans Supabase

## Prochaines Étapes

Une fois l'application fonctionnelle, vous pouvez :

1. **Personnaliser le thème** : Modifiez `lib/core/theme/app_colors.dart`
2. **Ajouter votre logo** : Placez-le dans `assets/` et mettez à jour le code
3. **Configurer RLS** : Sécurisez l'accès aux données par agence
4. **Déployer en production** : Suivez le guide dans `README_SETUP.md`

## Support

Pour toute question, consultez :
- [Documentation Flutter](https://flutter.dev/docs)
- [Documentation Supabase](https://supabase.com/docs)
- Le fichier `README_SETUP.md` pour plus de détails

