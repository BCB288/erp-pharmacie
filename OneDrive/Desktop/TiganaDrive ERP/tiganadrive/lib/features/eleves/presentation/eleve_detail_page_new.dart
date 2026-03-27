import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/extensions.dart';
import '../../../data/repositories/eleve_repository.dart';
import '../../../data/repositories/contrat_repository.dart';
import '../../../data/repositories/paiement_repository.dart';
import '../../../data/repositories/lecon_repository.dart';
import '../../../data/models/eleve.dart';
import 'widgets/eleve_form_widget.dart';

final eleveRepositoryProvider = Provider((ref) => EleveRepository());
final contratRepositoryProvider = Provider((ref) => ContratRepository());
final paiementRepositoryProvider = Provider((ref) => PaiementRepository());
final leconRepositoryProvider = Provider((ref) => LeconRepository());

final eleveDetailProvider =
    FutureProvider.autoDispose.family<Eleve?, String>((ref, id) async {
  final eleveRepo = ref.watch(eleveRepositoryProvider);
  return eleveRepo.getById(id);
});

final eleveContratsProvider =
    FutureProvider.autoDispose.family((ref, String eleveId) async {
  final contratRepo = ref.watch(contratRepositoryProvider);
  return contratRepo.getAll(eleveId: eleveId);
});

final elevePaiementsProvider =
    FutureProvider.autoDispose.family((ref, String contratId) async {
  final paiementRepo = ref.watch(paiementRepositoryProvider);
  return paiementRepo.getAll(contratId: contratId);
});

final eleveLeconsProvider =
    FutureProvider.autoDispose.family((ref, String contratId) async {
  final leconRepo = ref.watch(leconRepositoryProvider);
  return leconRepo.getAll(contratId: contratId);
});

class EleveDetailPageNew extends ConsumerStatefulWidget {
  final String eleveId;

  const EleveDetailPageNew({super.key, required this.eleveId});

  @override
  ConsumerState<EleveDetailPageNew> createState() =>
      _EleveDetailPageNewState();
}

class _EleveDetailPageNewState extends ConsumerState<EleveDetailPageNew> {
  bool _isEditMode = false;

  @override
  Widget build(BuildContext context) {
    final eleveAsync = ref.watch(eleveDetailProvider(widget.eleveId));

    return eleveAsync.when(
      data: (eleve) {
        if (eleve == null) {
          return const Center(child: Text('Élève non trouvé'));
        }
        return _buildContent(context, ref, eleve);
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text('Erreur: $error')),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, Eleve eleve) {
    return Scaffold(
      body: Row(
        children: [
          // Sidebar Gauche
          Container(
            width: 320,
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(right: BorderSide(color: AppColors.border)),
            ),
            child: _buildSidebar(context, ref, eleve),
          ),

          // Zone Principale
          Expanded(
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(bottom: BorderSide(color: AppColors.border)),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(LucideIcons.arrowLeft),
                        onPressed: () => context.go('/eleves'),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          'Détails de l\'Étudiant',
                          style: Theme.of(context)
                              .textTheme
                              .headlineSmall
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ),
                      if (!_isEditMode)
                        ElevatedButton.icon(
                          onPressed: () {
                            setState(() => _isEditMode = true);
                          },
                          icon: const Icon(LucideIcons.pencil),
                          label: const Text('Modifier'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                          ),
                        ),
                    ],
                  ),
                ),

                // Contenu
                Expanded(
                  child: _isEditMode
                      ? EleveFormWidget(
                          eleve: eleve,
                          agenceId: eleve.agenceId ?? '',
                          onSuccess: () {
                            setState(() => _isEditMode = false);
                            ref.invalidate(eleveDetailProvider(widget.eleveId));
                          },
                        )
                      : DefaultTabController(
                          length: 3,
                          child: Column(
                            children: [
                              const TabBar(
                                tabs: [
                                  Tab(text: 'Informations'),
                                  Tab(text: 'Formation'),
                                  Tab(text: 'Finance'),
                                ],
                              ),
                              Expanded(
                                child: TabBarView(
                                  children: [
                                    _buildInfoTab(context, eleve),
                                    _buildFormationTab(context, ref, eleve),
                                    _buildFinanceTab(context, ref, eleve),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSidebar(BuildContext context, WidgetRef ref, Eleve eleve) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Photo
          CircleAvatar(
            radius: 60,
            backgroundColor: AppColors.primary,
            child: Text(
              eleve.initiales,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 36,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Nom
          Text(
            eleve.nomComplet,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            'ID: AED-${eleve.id.substring(0, 8).toUpperCase()}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 24),

          // Statut
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: _getStatutColor(eleve.statut).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _getStatutIcon(eleve.statut),
                  size: 16,
                  color: _getStatutColor(eleve.statut),
                ),
                const SizedBox(width: 8),
                Text(
                  _getStatutLabel(eleve.statut),
                  style: TextStyle(
                    color: _getStatutColor(eleve.statut),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Résumé Financier
          _buildFinancialSummary(ref, eleve),
          const SizedBox(height: 24),

          // Coordonnées
          _buildContactInfo(eleve),
          const SizedBox(height: 24),

          // Contact d'urgence
          if (eleve.contactUrgenceNom != null) _buildEmergencyContact(eleve),
        ],
      ),
    );
  }

  Widget _buildFinancialSummary(WidgetRef ref, Eleve eleve) {
    final contratsAsync = ref.watch(eleveContratsProvider(eleve.id));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.account_balance_wallet, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Résumé Financier',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            contratsAsync.when(
              data: (contrats) {
                if (contrats.isEmpty) {
                  return const Text('Aucun contrat');
                }
                final contrat = contrats.first;
                final paiementsAsync =
                    ref.watch(elevePaiementsProvider(contrat.id));

                return paiementsAsync.when(
                  data: (paiements) {
                    final totalPaye = paiements.fold<double>(
                      0,
                      (sum, p) => sum + p.montant,
                    );
                    final resteAPayer = contrat.montantTotal - totalPaye;

                    return Column(
                      children: [
                        _buildFinancialRow(
                          'Total',
                          contrat.montantTotal.toCurrency(),
                          AppColors.textPrimary,
                        ),
                        const Divider(),
                        _buildFinancialRow(
                          'Payé',
                          totalPaye.toCurrency(),
                          AppColors.success,
                        ),
                        const Divider(),
                        _buildFinancialRow(
                          'Reste',
                          resteAPayer.toCurrency(),
                          resteAPayer > 0 ? AppColors.error : AppColors.success,
                        ),
                      ],
                    );
                  },
                  loading: () => const CircularProgressIndicator(),
                  error: (_, __) => const Text('Erreur'),
                );
              },
              loading: () => const CircularProgressIndicator(),
              error: (_, __) => const Text('Erreur'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFinancialRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactInfo(Eleve eleve) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(LucideIcons.phone, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Coordonnées',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (eleve.telephone != null) ...[
              _buildInfoItem(LucideIcons.phone, eleve.telephone!),
              const SizedBox(height: 8),
            ],
            if (eleve.email != null) ...[
              _buildInfoItem(LucideIcons.mail, eleve.email!),
              const SizedBox(height: 8),
            ],
            if (eleve.adresse != null) ...[
              _buildInfoItem(LucideIcons.mapPin, eleve.adresse!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmergencyContact(Eleve eleve) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.emergency, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Contact d\'urgence',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              eleve.contactUrgenceNom ?? '',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            if (eleve.contactUrgenceRelation != null) ...[
              const SizedBox(height: 4),
              Text(
                eleve.contactUrgenceRelation!,
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
            if (eleve.contactUrgenceTelephone != null) ...[
              const SizedBox(height: 8),
              _buildInfoItem(
                LucideIcons.phone,
                eleve.contactUrgenceTelephone!,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 14),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoTab(BuildContext context, Eleve eleve) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Informations Personnelles',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 24),
              _buildInfoRow('Nom complet', eleve.nomComplet),
              _buildInfoRow(
                'Date de naissance',
                eleve.dateNaissance?.toFormattedDate() ?? 'N/A',
              ),
              _buildInfoRow('Téléphone', eleve.telephone ?? 'N/A'),
              _buildInfoRow('Email', eleve.email ?? 'N/A'),
              _buildInfoRow('Adresse', eleve.adresse ?? 'N/A'),
              if (eleve.ville != null) _buildInfoRow('Ville', eleve.ville!),
              if (eleve.codePostal != null)
                _buildInfoRow('Code postal', eleve.codePostal!),
              _buildInfoRow('Statut', _getStatutLabel(eleve.statut)),
              _buildInfoRow(
                'Date d\'inscription',
                eleve.createdAt?.toFormattedDate() ?? 'N/A',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFormationTab(BuildContext context, WidgetRef ref, Eleve eleve) {
    final contratsAsync = ref.watch(eleveContratsProvider(eleve.id));

    return contratsAsync.when(
      data: (contrats) {
        if (contrats.isEmpty) {
          return const Center(child: Text('Aucun contrat'));
        }

        final contrat = contrats.first;
        final leconsAsync = ref.watch(eleveLeconsProvider(contrat.id));

        return leconsAsync.when(
          data: (lecons) {
            final heuresEffectuees = lecons
                    .where((l) => l.statut == 'effectue')
                    .fold<int>(0, (sum, l) => sum + l.dureeMinutes) ~/
                60;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  // Progression
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Progression',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 16),
                          LinearProgressIndicator(
                            value: heuresEffectuees /
                                contrat.nombreHeuresPrevues,
                            minHeight: 8,
                            backgroundColor: AppColors.borderLight,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '$heuresEffectuees / ${contrat.nombreHeuresPrevues} heures',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Leçons
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Historique des Leçons',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 16),
                          if (lecons.isEmpty)
                            const Center(child: Text('Aucune leçon'))
                          else
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: lecons.length,
                              separatorBuilder: (_, __) => const Divider(),
                              itemBuilder: (context, index) {
                                final lecon = lecons[index];
                                return ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  leading: Icon(
                                    LucideIcons.clock,
                                    color: lecon.statut == 'effectue'
                                        ? AppColors.success
                                        : AppColors.warning,
                                  ),
                                  title: Text(
                                    lecon.moniteurNom ?? 'Moniteur N/A',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  subtitle: Text(
                                    lecon.themeAborde ?? 'Thème non défini',
                                  ),
                                  trailing: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        lecon.dateHeureDebut.toFormattedDate(),
                                      ),
                                      Text(
                                        '${lecon.dureeMinutes} min',
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall,
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text('Erreur: $error')),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text('Erreur: $error')),
    );
  }

  Widget _buildFinanceTab(BuildContext context, WidgetRef ref, Eleve eleve) {
    final contratsAsync = ref.watch(eleveContratsProvider(eleve.id));

    return contratsAsync.when(
      data: (contrats) {
        if (contrats.isEmpty) {
          return const Center(child: Text('Aucun contrat'));
        }

        final contrat = contrats.first;
        final paiementsAsync = ref.watch(elevePaiementsProvider(contrat.id));

        return paiementsAsync.when(
          data: (paiements) {
            final totalPaye = paiements.fold<double>(
              0,
              (sum, p) => sum + p.montant,
            );
            final resteAPayer = contrat.montantTotal - totalPaye;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  // Summary
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Total Forfait',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                Text(
                                  contrat.montantTotal.toCurrency(),
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Déjà Payé',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                Text(
                                  totalPaye.toCurrency(),
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleLarge
                                      ?.copyWith(color: AppColors.success),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Reste à Payer',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                Text(
                                  resteAPayer.toCurrency(),
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleLarge
                                      ?.copyWith(
                                        color: resteAPayer > 0
                                            ? AppColors.warning
                                            : AppColors.success,
                                      ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Paiements
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Historique des Paiements',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 16),
                          if (paiements.isEmpty)
                            const Center(child: Text('Aucun paiement'))
                          else
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: paiements.length,
                              separatorBuilder: (_, __) => const Divider(),
                              itemBuilder: (context, index) {
                                final paiement = paiements[index];
                                return ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  leading: const Icon(Icons.check_circle,
                                      color: AppColors.success),
                                  title: Text(
                                    paiement.montant.toCurrency(),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  subtitle: Text(
                                    paiement.modePaiement?.toUpperCase() ??
                                        'N/A',
                                  ),
                                  trailing: Text(
                                    paiement.datePaiement.toFormattedDate(),
                                  ),
                                );
                              },
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text('Erreur: $error')),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text('Erreur: $error')),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 150,
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatutColor(String statut) {
    switch (statut) {
      case 'inscrit':
        return AppColors.info;
      case 'en_formation':
        return AppColors.warning;
      case 'permis_obtenu':
        return AppColors.success;
      case 'abandon':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  IconData _getStatutIcon(String statut) {
    switch (statut) {
      case 'inscrit':
        return LucideIcons.userPlus;
      case 'en_formation':
        return LucideIcons.bookOpen;
      case 'permis_obtenu':
        return LucideIcons.award;
      case 'abandon':
        return LucideIcons.userX;
      default:
        return LucideIcons.user;
    }
  }

  String _getStatutLabel(String statut) {
    switch (statut) {
      case 'inscrit':
        return 'Inscrit';
      case 'en_formation':
        return 'En formation';
      case 'permis_obtenu':
        return 'Permis obtenu';
      case 'abandon':
        return 'Abandon';
      default:
        return statut;
    }
  }
}

