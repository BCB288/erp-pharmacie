# TiganaDrive Manager - Guide de Configuration

Application ERP professionnelle pour auto-école développée avec Flutter et Supabase.

## 🚀 Configuration Initiale

### 1. Prérequis

- Flutter SDK (3.10.0 ou supérieur)
- Un compte Supabase (gratuit)
- Un éditeur de code (VS Code, Android Studio, etc.)

### 2. Configuration Supabase

#### A. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre **URL du projet** et votre **clé anon** (disponibles dans Settings > API)

#### B. Configurer les identifiants

Ouvrez le fichier `lib/core/constants/app_constants.dart` et remplacez :

```dart
static const String supabaseUrl = 'YOUR_SUPABASE_URL';
static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

Par vos vraies valeurs Supabase.

### 3. Installation des Dépendances

```bash
flutter pub get
```

### 4. Lancer l'Application

#### Pour le Web (recommandé pour un ERP)

```bash
flutter run -d chrome
```

#### Pour Windows

```bash
flutter run -d windows
```

#### Pour macOS

```bash
flutter run -d macos
```

## 📊 Structure de la Base de Données

La base de données Supabase contient déjà les tables suivantes :

- `agences` - Gestion des agences/filiales
- `eleves` - Informations des élèves
- `contrats` - Contrats de formation
- `paiements` - Historique des paiements
- `lecons` - Planning des leçons de conduite
- `examens` - Résultats des examens

### Configuration RLS (Row Level Security)

Pour sécuriser votre application, configurez les politiques RLS dans Supabase :

1. Allez dans **Authentication > Policies**
2. Pour chaque table, créez des politiques basées sur l'agence de l'utilisateur

Exemple de politique pour la table `eleves` :

```sql
-- Permettre la lecture des élèves de son agence
CREATE POLICY "Users can view their agency students"
ON eleves FOR SELECT
USING (
  agence_id IN (
    SELECT agence_id FROM user_agences 
    WHERE user_id = auth.uid()
  )
);
```

## 👤 Créer un Premier Utilisateur

Dans le dashboard Supabase :

1. Allez dans **Authentication > Users**
2. Cliquez sur "Add user"
3. Créez un utilisateur avec email/mot de passe
4. Utilisez ces identifiants pour vous connecter à l'application

## 🎨 Fonctionnalités Implémentées

### ✅ Dashboard
- Vue d'ensemble avec KPI
- Statistiques en temps réel
- Derniers paiements et leçons du jour

### ✅ Gestion des Élèves
- Liste complète avec recherche et filtres
- Fiche détaillée avec onglets (Infos, Contrats, Finance, Leçons)
- Suivi de la progression

### ✅ Planning
- Vue hebdomadaire des leçons
- Filtrage par moniteur
- Statuts des leçons (planifié, effectué, annulé)

### ✅ Finance
- Tableau de bord financier
- Liste des paiements avec filtres par date
- Répartition par mode de paiement
- Export (à venir)

## 🔧 Personnalisation

### Modifier les Couleurs

Éditez `lib/core/theme/app_colors.dart` :

```dart
static const Color primary = Color(0xFF1E40AF); // Votre couleur primaire
static const Color secondary = Color(0xFFF59E0B); // Votre couleur secondaire
```

### Ajouter un Logo

1. Placez votre logo dans `assets/images/logo.png`
2. Mettez à jour `pubspec.yaml` :

```yaml
flutter:
  assets:
    - assets/images/
```

3. Modifiez `lib/shared/widgets/main_layout.dart` pour utiliser votre logo

## 📱 Déploiement Web

### Build pour Production

```bash
flutter build web --release
```

Les fichiers seront dans `build/web/`. Vous pouvez les déployer sur :

- **Vercel** (gratuit)
- **Netlify** (gratuit)
- **Firebase Hosting** (gratuit)
- Votre propre serveur

### Exemple avec Netlify

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Déployer
netlify deploy --dir=build/web --prod
```

## 🔐 Sécurité

### Variables d'Environnement (Production)

Pour la production, utilisez des variables d'environnement au lieu de valeurs hardcodées :

1. Créez un fichier `.env` (à ne pas commiter)
2. Utilisez le package `flutter_dotenv`
3. Chargez les variables au démarrage

## 🐛 Dépannage

### Erreur de connexion Supabase

- Vérifiez que vos identifiants sont corrects
- Assurez-vous que RLS est bien configuré
- Vérifiez votre connexion Internet

### Problème de build

```bash
flutter clean
flutter pub get
flutter run
```

## 📚 Ressources

- [Documentation Flutter](https://flutter.dev/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Riverpod](https://riverpod.dev)

## 🤝 Support

Pour toute question ou problème, consultez la documentation ou contactez votre administrateur système.

---

**Version:** 1.0.0  
**Dernière mise à jour:** Novembre 2025

