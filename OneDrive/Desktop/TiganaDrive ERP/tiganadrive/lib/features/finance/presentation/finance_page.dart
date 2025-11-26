import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:data_table_2/data_table_2.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/agence_provider.dart';
import '../../../core/utils/extensions.dart';
import '../../../data/repositories/paiement_repository.dart';
import '../../../data/models/paiement.dart';

final paiementRepositoryProvider = Provider((ref) => PaiementRepository());

final financeDateRangeProvider = StateProvider<DateTimeRange?>((ref) {
  final now = DateTime.now();
  final startOfMonth = DateTime(now.year, now.month, 1);
  final endOfMonth = DateTime(now.year, now.month + 1, 0, 23, 59, 59);
  return DateTimeRange(start: startOfMonth, end: endOfMonth);
});

final financePaiementsProvider = FutureProvider.autoDispose((ref) async {
  final agenceId = ref.watch(selectedAgenceIdProvider);
  if (agenceId == null) return <Paiement>[];

  final dateRange = ref.watch(financeDateRangeProvider);
  final paiementRepo = ref.watch(paiementRepositoryProvider);

  return paiementRepo.getAll(
    agenceId: agenceId,
    startDate: dateRange?.start,
    endDate: dateRange?.end,
  );
});

final financeStatsProvider = FutureProvider.autoDispose((ref) async {
  final agenceId = ref.watch(selectedAgenceIdProvider);
  if (agenceId == null) return null;

  final dateRange = ref.watch(financeDateRangeProvider);
  final paiementRepo = ref.watch(paiementRepositoryProvider);

  final total = await paiementRepo.getTotalByAgence(
    agenceId,
    startDate: dateRange?.start,
    endDate: dateRange?.end,
  );

  final paiements = await paiementRepo.getAll(
    agenceId: agenceId,
    startDate: dateRange?.start,
    endDate: dateRange?.end,
  );

  // Group by mode
  final byMode = <String, double>{};
  for (final p in paiements) {
    final mode = p.modePaiement ?? 'Non spécifié';
    byMode[mode] = (byMode[mode] ?? 0) + p.montant;
  }

  return {
    'total': total,
    'count': paiements.length,
    'byMode': byMode,
  };
});

class FinancePage extends ConsumerWidget {
  const FinancePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dateRange = ref.watch(financeDateRangeProvider);
    final paiementsAsync = ref.watch(financePaiementsProvider);
    final statsAsync = ref.watch(financeStatsProvider);

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Gestion Financière',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Suivi des paiements et du chiffre d\'affaires',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
              OutlinedButton.icon(
                onPressed: () async {
                  final picked = await showDateRangePicker(
                    context: context,
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                    initialDateRange: dateRange,
                  );
                  if (picked != null) {
                    ref.read(financeDateRangeProvider.notifier).state = picked;
                  }
                },
                icon: const Icon(LucideIcons.calendar),
                label: Text(
                  dateRange != null
                      ? '${dateRange.start.toFormattedDate()} - ${dateRange.end.toFormattedDate()}'
                      : 'Sélectionner une période',
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Stats Cards
          statsAsync.when(
            data: (stats) {
              if (stats == null) return const SizedBox.shrink();
              return Row(
                children: [
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
                                  'Chiffre d\'Affaires',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                                ),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: AppColors.success.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(
                                    LucideIcons.trendingUp,
                                    size: 20,
                                    color: AppColors.success,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              (stats['total'] as double).toCurrency(),
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
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
                                  'Nombre de Paiements',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                                ),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: AppColors.info.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(
                                    LucideIcons.receipt,
                                    size: 20,
                                    color: AppColors.info,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '${stats['count']}',
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: 16),

          // Payments by Mode
          statsAsync.when(
            data: (stats) {
              if (stats == null) return const SizedBox.shrink();
              final byMode = stats['byMode'] as Map<String, double>;
              if (byMode.isEmpty) return const SizedBox.shrink();

              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Répartition par Mode de Paiement',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 16,
                        runSpacing: 8,
                        children: byMode.entries.map((entry) {
                          return Chip(
                            label: Text(
                              '${entry.key.toUpperCase()}: ${entry.value.toCurrency()}',
                            ),
                            backgroundColor: AppColors.primary.withOpacity(0.1),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: 16),

          // Payments Table
          Expanded(
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Liste des Paiements',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        OutlinedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Export à venir')),
                            );
                          },
                          icon: const Icon(LucideIcons.download, size: 16),
                          label: const Text('Exporter'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: paiementsAsync.when(
                        data: (paiements) {
                          if (paiements.isEmpty) {
                            return const Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    LucideIcons.banknote,
                                    size: 64,
                                    color: AppColors.textTertiary,
                                  ),
                                  SizedBox(height: 16),
                                  Text('Aucun paiement trouvé'),
                                ],
                              ),
                            );
                          }

                          return DataTable2(
                            columnSpacing: 12,
                            horizontalMargin: 12,
                            minWidth: 900,
                            columns: const [
                              DataColumn2(
                                label: Text('Date'),
                                size: ColumnSize.M,
                              ),
                              DataColumn2(
                                label: Text('Montant'),
                                size: ColumnSize.M,
                              ),
                              DataColumn2(
                                label: Text('Mode'),
                                size: ColumnSize.M,
                              ),
                              DataColumn2(
                                label: Text('Référence'),
                                size: ColumnSize.L,
                              ),
                              DataColumn2(
                                label: Text('Reçu N°'),
                                size: ColumnSize.M,
                              ),
                              DataColumn2(
                                label: Text('Observation'),
                                size: ColumnSize.L,
                              ),
                            ],
                            rows: paiements.map((paiement) {
                              return DataRow2(
                                cells: [
                                  DataCell(
                                    Text(paiement.datePaiement.toFormattedDate()),
                                  ),
                                  DataCell(
                                    Text(
                                      paiement.montant.toCurrency(),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.success,
                                      ),
                                    ),
                                  ),
                                  DataCell(
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        paiement.modePaiement?.toUpperCase() ?? 'N/A',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ),
                                  DataCell(
                                    Text(paiement.referenceExterne ?? '-'),
                                  ),
                                  DataCell(
                                    Text(paiement.recuNumero ?? '-'),
                                  ),
                                  DataCell(
                                    Text(
                                      paiement.observation ?? '-',
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              );
                            }).toList(),
                          );
                        },
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (error, _) => Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.error_outline,
                                size: 64,
                                color: AppColors.error,
                              ),
                              const SizedBox(height: 16),
                              Text('Erreur: $error'),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

