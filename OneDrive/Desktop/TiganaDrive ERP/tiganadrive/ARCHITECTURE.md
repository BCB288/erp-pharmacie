# Architecture de TiganaDrive Manager

## Vue d'Ensemble

TiganaDrive Manager est une application ERP (Enterprise Resource Planning) moderne développée avec Flutter et Supabase, suivant les meilleures pratiques de développement logiciel.

## Stack Technique

### Frontend
- **Flutter** : Framework UI cross-platform
- **Riverpod** : State management réactif et performant
- **GoRouter** : Navigation déclarative avec support des deep links
- **Material Design 3** : Design system moderne

### Backend
- **Supabase** : Backend-as-a-Service
  - PostgreSQL (base de données relationnelle)
  - Auth (authentification JWT)
  - Realtime (websockets pour les mises à jour en temps réel)
  - Row Level Security (sécurité au niveau des lignes)

### UI Components
- **Google Fonts** : Typographie professionnelle (Inter)
- **Lucide Icons** : Iconographie moderne et cohérente
- **DataTable2** : Tableaux de données avancés
- **FL Chart** : Graphiques et visualisations

## Architecture du Code

### Structure des Dossiers

```
lib/
├── core/                      # Fonctionnalités transversales
│   ├── constants/            # Constantes globales
│   ├── providers/            # Providers Riverpod globaux
│   ├── router/               # Configuration du routing
│   ├── theme/                # Design system (couleurs, thème)
│   └── utils/                # Utilitaires et extensions
│
├── data/                      # Couche de données
│   ├── models/               # Modèles de données (DTOs)
│   ├── repositories/         # Abstraction des appels API
│   └── supabase_client.dart  # Client Supabase singleton
│
├── features/                  # Modules fonctionnels (Feature-first)
│   ├── auth/                 # Authentification
│   │   └── presentation/     # UI de connexion
│   ├── dashboard/            # Tableau de bord
│   │   └── presentation/     # UI du dashboard
│   ├── eleves/               # Gestion des élèves
│   │   └── presentation/     # UI liste et détail
│   ├── finance/              # Gestion financière
│   │   └── presentation/     # UI finance
│   └── planning/             # Planning des leçons
│       └── presentation/     # UI planning
│
├── shared/                    # Composants réutilisables
│   └── widgets/              # Widgets partagés
│
└── main.dart                  # Point d'entrée de l'application
```

### Principes Architecturaux

#### 1. Feature-First Organization
Chaque module métier (`eleves`, `finance`, etc.) est isolé dans son propre dossier, facilitant :
- La maintenance
- Les tests
- La scalabilité
- Le travail en équipe

#### 2. Separation of Concerns

**Présentation** (UI)
- Widgets Flutter
- Gestion de l'état local (formulaires, animations)
- Consomme les providers Riverpod

**Données** (Data Layer)
- Modèles : Classes Dart représentant les entités métier
- Repositories : Abstraction des appels Supabase
- Pas de logique métier

**Logique** (Business Logic)
- Providers Riverpod
- Transformations de données
- Règles métier

#### 3. Dependency Injection avec Riverpod

Tous les services sont injectés via des providers :

```dart
// Repository provider
final eleveRepositoryProvider = Provider((ref) => EleveRepository());

// Data provider
final elevesProvider = FutureProvider.autoDispose((ref) async {
  final repo = ref.watch(eleveRepositoryProvider);
  return repo.getAll();
});
```

Avantages :
- Testabilité (mock facile)
- Pas de singletons globaux
- Gestion automatique du cycle de vie

## Flux de Données

### Lecture (Read)

```
UI Widget
  ↓ (ref.watch)
Provider Riverpod
  ↓ (appelle)
Repository
  ↓ (requête)
Supabase API
  ↓ (retourne)
Modèle Dart
  ↓ (affiche)
UI Widget
```

### Écriture (Write)

```
UI Widget (action utilisateur)
  ↓ (appelle)
Provider Notifier
  ↓ (appelle)
Repository.create/update()
  ↓ (envoie)
Supabase API
  ↓ (confirmation)
Provider se met à jour
  ↓ (rebuild)
UI Widget
```

## Modèle de Données

### Entités Principales

```
Agence (1) ──┬── (N) Eleve
             │
             ├── (N) Contrat ──┬── (N) Paiement
             │                 │
             │                 ├── (N) Lecon
             │                 │
             │                 └── (N) Examen
             │
             └── (N) Paiement
```

### Relations Clés

- **Agence** : Point central (multi-tenant)
- **Eleve** : Appartient à une agence
- **Contrat** : Lie un élève à une formation
- **Paiement** : Lié à un contrat et une agence
- **Lecon** : Liée à un contrat et un moniteur (auth.users)

## Sécurité

### Row Level Security (RLS)

Chaque table Supabase doit avoir des politiques RLS pour :
- Isoler les données par agence
- Restreindre l'accès selon le rôle utilisateur
- Empêcher les accès non autorisés

Exemple de politique :

```sql
-- Les utilisateurs ne voient que les élèves de leur agence
CREATE POLICY "agence_isolation" ON eleves
FOR SELECT USING (
  agence_id IN (
    SELECT agence_id FROM user_agences 
    WHERE user_id = auth.uid()
  )
);
```

### Authentification

- **JWT Tokens** : Gérés automatiquement par Supabase
- **Session Persistence** : Stockage sécurisé local
- **Auto-refresh** : Renouvellement automatique des tokens

## Performance

### Optimisations Implémentées

1. **Providers autoDispose** : Nettoyage automatique de la mémoire
2. **Pagination** : Chargement par lots (non implémenté dans v1)
3. **Caching** : Riverpod cache automatiquement les données
4. **Lazy Loading** : Chargement à la demande des modules

### Realtime (Optionnel)

Supabase permet d'écouter les changements en temps réel :

```dart
final subscription = supabase
  .from('paiements')
  .stream(primaryKey: ['id'])
  .listen((data) {
    // Mise à jour automatique de l'UI
  });
```

## Extensibilité

### Ajouter un Nouveau Module

1. Créer le dossier dans `lib/features/mon_module/`
2. Créer les modèles dans `lib/data/models/`
3. Créer le repository dans `lib/data/repositories/`
4. Créer les providers
5. Créer les pages UI
6. Ajouter la route dans `app_router.dart`
7. Ajouter l'entrée dans le menu (`main_layout.dart`)

### Ajouter une Nouvelle Table Supabase

1. Créer la table dans Supabase
2. Configurer RLS
3. Créer le modèle Dart correspondant
4. Créer le repository
5. Créer les providers
6. Créer l'UI

## Tests (À Implémenter)

### Structure Recommandée

```
test/
├── unit/
│   ├── models/
│   └── repositories/
├── widget/
│   └── features/
└── integration/
```

### Outils Suggérés

- **flutter_test** : Tests unitaires et widgets
- **mockito** : Mock des dépendances
- **integration_test** : Tests end-to-end

## Déploiement

### Web (Production)

```bash
flutter build web --release --web-renderer canvaskit
```

### Desktop

```bash
# Windows
flutter build windows --release

# macOS
flutter build macos --release

# Linux
flutter build linux --release
```

## Maintenance

### Mise à Jour des Dépendances

```bash
flutter pub outdated
flutter pub upgrade
```

### Analyse du Code

```bash
flutter analyze
dart format lib/
```

## Évolutions Futures

### Fonctionnalités Prévues

- [ ] Gestion des documents (permis, photos)
- [ ] Notifications push
- [ ] Export PDF/Excel
- [ ] Statistiques avancées avec graphiques
- [ ] Mode hors ligne
- [ ] Application mobile native
- [ ] Gestion des rôles utilisateurs
- [ ] Audit trail (historique des modifications)

### Améliorations Techniques

- [ ] Tests automatisés
- [ ] CI/CD (GitHub Actions)
- [ ] Monitoring (Sentry)
- [ ] Analytics (Google Analytics)
- [ ] Internationalisation (i18n)

---

**Auteur** : Équipe TiganaDrive  
**Version** : 1.0.0  
**Dernière mise à jour** : Novembre 2025

