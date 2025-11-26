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

class EleveDetailPage extends ConsumerWidget {
  final String eleveId;

  const EleveDetailPage({super.key, required this.eleveId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eleveAsync = ref.watch(eleveDetailProvider(eleveId));

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
    return DefaultTabController(
      length: 4,
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(LucideIcons.arrowLeft),
                      onPressed: () => context.go('/eleves'),
                    ),
                    const SizedBox(width: 16),
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: AppColors.primary,
                      child: Text(
                        eleve.prenom[0].toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            eleve.nomComplet,
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              if (eleve.telephone != null) ...[
                                const Icon(LucideIcons.phone, size: 16),
                                const SizedBox(width: 4),
                                Text(eleve.telephone!),
                                const SizedBox(width: 16),
                              ],
                              if (eleve.email != null) ...[
                                const Icon(LucideIcons.mail, size: 16),
                                const SizedBox(width: 4),
                                Text(eleve.email!),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Fonctionnalité à venir')),
                        );
                      },
                      icon: const Icon(LucideIcons.pencil),
                      label: const Text('Modifier'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const TabBar(
                  tabs: [
                    Tab(text: 'Informations'),
                    Tab(text: 'Contrats'),
                    Tab(text: 'Finance'),
                    Tab(text: 'Leçons'),
                  ],
                ),
              ],
            ),
          ),

          // Tab Content
          Expanded(
            child: TabBarView(
              children: [
                _buildInfoTab(context, eleve),
                _buildContratsTab(context, ref, eleve),
                _buildFinanceTab(context, ref, eleve),
                _buildLeconsTab(context, ref, eleve),
              ],
            ),
          ),
        ],
      ),
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
              _buildInfoRow('Nom', eleve.nom),
              _buildInfoRow('Prénom', eleve.prenom),
              _buildInfoRow(
                'Date de naissance',
                eleve.dateNaissance?.toFormattedDate() ?? 'N/A',
              ),
              _buildInfoRow('Téléphone', eleve.telephone ?? 'N/A'),
              _buildInfoRow('Email', eleve.email ?? 'N/A'),
              _buildInfoRow('Adresse', eleve.adresse ?? 'N/A'),
              _buildInfoRow('Statut', eleve.statut),
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

  Widget _buildContratsTab(BuildContext context, WidgetRef ref, Eleve eleve) {
    final contratsAsync = ref.watch(eleveContratsProvider(eleve.id));

    return contratsAsync.when(
      data: (contrats) {
        if (contrats.isEmpty) {
          return const Center(child: Text('Aucun contrat'));
        }
        return ListView.builder(
          padding: const EdgeInsets.all(24),
          itemCount: contrats.length,
          itemBuilder: (context, index) {
            final contrat = contrats[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 16),
              child: ListTile(
                leading: const Icon(LucideIcons.fileText),
                title: Text('Permis ${contrat.categoriePermis}'),
                subtitle: Text(
                  '${contrat.typeFormation} - ${contrat.nombreHeuresPrevues}h',
                ),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      contrat.montantTotal.toCurrency(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      contrat.statut,
                      style: TextStyle(
                        fontSize: 12,
                        color: contrat.statut == 'actif'
                            ? AppColors.success
                            : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
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
                  // Summary Card
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

                  // Payments List
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Historique des Paiements',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              ElevatedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Fonctionnalité à venir'),
                                    ),
                                  );
                                },
                                icon: const Icon(LucideIcons.plus, size: 16),
                                label: const Text('Ajouter'),
                              ),
                            ],
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
                                    paiement.modePaiement?.toUpperCase() ?? 'N/A',
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

  Widget _buildLeconsTab(BuildContext context, WidgetRef ref, Eleve eleve) {
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
            if (lecons.isEmpty) {
              return const Center(child: Text('Aucune leçon'));
            }

            final heuresEffectuees = lecons
                .where((l) => l.statut == 'effectue')
                .fold<int>(0, (sum, l) => sum + l.dureeMinutes) ~/
                60;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  // Progress Card
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

                  // Lessons List
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
                                      style: Theme.of(context).textTheme.bodySmall,
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
}

