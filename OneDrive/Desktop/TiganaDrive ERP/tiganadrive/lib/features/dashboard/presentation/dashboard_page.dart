import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/agence_provider.dart';
import '../../../core/utils/extensions.dart';
import '../../../data/repositories/eleve_repository.dart';
import '../../../data/repositories/contrat_repository.dart';
import '../../../data/repositories/paiement_repository.dart';
import '../../../data/repositories/lecon_repository.dart';
import '../../../data/models/paiement.dart';
import '../../../data/models/lecon.dart';
import '../../../shared/widgets/stat_card.dart';

final eleveRepositoryProvider = Provider((ref) => EleveRepository());
final contratRepositoryProvider = Provider((ref) => ContratRepository());
final paiementRepositoryProvider = Provider((ref) => PaiementRepository());
final leconRepositoryProvider = Provider((ref) => LeconRepository());

final dashboardStatsProvider = FutureProvider.autoDispose((ref) async {
  final agenceId = ref.watch(selectedAgenceIdProvider);
  if (agenceId == null) return null;

  final eleveRepo = ref.watch(eleveRepositoryProvider);
  final contratRepo = ref.watch(contratRepositoryProvider);
  final paiementRepo = ref.watch(paiementRepositoryProvider);

  final now = DateTime.now();
  final startOfMonth = DateTime(now.year, now.month, 1);
  final endOfMonth = DateTime(now.year, now.month + 1, 0, 23, 59, 59);

  final results = await Future.wait([
    eleveRepo.countByAgence(agenceId),
    contratRepo.countByAgence(agenceId, statut: 'actif'),
    paiementRepo.getTotalByAgence(
      agenceId,
      startDate: startOfMonth,
      endDate: endOfMonth,
    ),
  ]);

  return {
    'totalEleves': results[0] as int,
    'contratsActifs': results[1] as int,
    'caduMois': results[2] as double,
  };
});

final recentPaiementsProvider = FutureProvider.autoDispose((ref) async {
  final agenceId = ref.watch(selectedAgenceIdProvider);
  if (agenceId == null) return <Paiement>[];

  final paiementRepo = ref.watch(paiementRepositoryProvider);
  final paiements = await paiementRepo.getAll(agenceId: agenceId);
  return paiements.take(5).toList();
});

final todayLeconsProvider = FutureProvider.autoDispose((ref) async {
  final agenceId = ref.watch(selectedAgenceIdProvider);
  if (agenceId == null) return <Lecon>[];

  final leconRepo = ref.watch(leconRepositoryProvider);
  final today = DateTime.now();
  return leconRepo.getByDate(today);
});

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedAgence = ref.watch(selectedAgenceProvider);
    final statsAsync = ref.watch(dashboardStatsProvider);
    final recentPaiementsAsync = ref.watch(recentPaiementsProvider);
    final todayLeconsAsync = ref.watch(todayLeconsProvider);

    if (selectedAgence == null) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome Section
          Text(
            'Bienvenue sur ${selectedAgence.nom}',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Voici un aperçu de votre activité',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 24),

          // Stats Cards
          statsAsync.when(
            data: (stats) {
              if (stats == null) return const SizedBox.shrink();
              return GridView.count(
                crossAxisCount: MediaQuery.of(context).size.width > 1200 ? 4 : 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 1.5,
                children: [
                  StatCard(
                    title: 'Total Élèves',
                    value: '${stats['totalEleves']}',
                    icon: LucideIcons.users,
                    iconColor: AppColors.primary,
                    onTap: () => context.go('/eleves'),
                  ),
                  StatCard(
                    title: 'Contrats Actifs',
                    value: '${stats['contratsActifs']}',
                    icon: LucideIcons.fileText,
                    iconColor: AppColors.success,
                  ),
                  StatCard(
                    title: 'CA du Mois',
                    value: (stats['caduMois'] as double).toCurrency(),
                    icon: LucideIcons.trendingUp,
                    iconColor: AppColors.secondary,
                    subtitle: DateTime.now().toFormattedDate(),
                  ),
                  StatCard(
                    title: 'Leçons Aujourd\'hui',
                    value: todayLeconsAsync.when(
                      data: (lecons) => '${lecons.length}',
                      loading: () => '...',
                      error: (_, __) => '0',
                    ),
                    icon: LucideIcons.calendar,
                    iconColor: AppColors.info,
                    onTap: () => context.go('/planning'),
                  ),
                ],
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(
              child: Text('Erreur: $error'),
            ),
          ),

          const SizedBox(height: 32),

          // Recent Activity
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Recent Payments
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Derniers Paiements',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            TextButton(
                              onPressed: () => context.go('/finance'),
                              child: const Text('Voir tout'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        recentPaiementsAsync.when(
                          data: (paiements) {
                            if (paiements.isEmpty) {
                              return const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(32),
                                  child: Text('Aucun paiement récent'),
                                ),
                              );
                            }
                            return ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: paiements.length,
                              separatorBuilder: (_, __) => const Divider(),
                              itemBuilder: (context, index) {
                                final paiement = paiements[index];
                                return ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  leading: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppColors.success.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(
                                      LucideIcons.banknote,
                                      color: AppColors.success,
                                      size: 20,
                                    ),
                                  ),
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
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                );
                              },
                            );
                          },
                          loading: () => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(32),
                              child: CircularProgressIndicator(),
                            ),
                          ),
                          error: (error, _) => Center(
                            child: Text('Erreur: $error'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(width: 16),

              // Today's Lessons
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Leçons d\'Aujourd\'hui',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            TextButton(
                              onPressed: () => context.go('/planning'),
                              child: const Text('Voir tout'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        todayLeconsAsync.when(
                          data: (lecons) {
                            if (lecons.isEmpty) {
                              return const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(32),
                                  child: Text('Aucune leçon prévue'),
                                ),
                              );
                            }
                            return ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: lecons.length.clamp(0, 5),
                              separatorBuilder: (_, __) => const Divider(),
                              itemBuilder: (context, index) {
                                final lecon = lecons[index];
                                return ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  leading: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppColors.info.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(
                                      LucideIcons.clock,
                                      color: AppColors.info,
                                      size: 20,
                                    ),
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
                                  trailing: Text(
                                    lecon.dateHeureDebut.toFormattedTime(),
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                );
                              },
                            );
                          },
                          loading: () => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(32),
                              child: CircularProgressIndicator(),
                            ),
                          ),
                          error: (error, _) => Center(
                            child: Text('Erreur: $error'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

