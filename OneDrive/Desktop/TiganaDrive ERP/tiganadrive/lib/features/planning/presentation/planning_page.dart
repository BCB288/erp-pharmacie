import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/extensions.dart';
import '../../../data/repositories/lecon_repository.dart';
import '../../../data/models/lecon.dart';

final leconRepositoryProvider = Provider((ref) => LeconRepository());

final selectedDateProvider = StateProvider<DateTime>((ref) => DateTime.now());

final planningLeconsProvider = FutureProvider.autoDispose((ref) async {
  final selectedDate = ref.watch(selectedDateProvider);
  final leconRepo = ref.watch(leconRepositoryProvider);
  
  final startOfWeek = selectedDate.subtract(Duration(days: selectedDate.weekday - 1));
  final endOfWeek = startOfWeek.add(const Duration(days: 7));
  
  return leconRepo.getAll(
    startDate: startOfWeek,
    endDate: endOfWeek,
  );
});

class PlanningPage extends ConsumerWidget {
  const PlanningPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = ref.watch(selectedDateProvider);
    final leconsAsync = ref.watch(planningLeconsProvider);

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
                      'Planning des Leçons',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Gestion des leçons de conduite',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Fonctionnalité à venir')),
                  );
                },
                icon: const Icon(LucideIcons.plus),
                label: const Text('Nouvelle Leçon'),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Date Selector
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(LucideIcons.chevronLeft),
                    onPressed: () {
                      ref.read(selectedDateProvider.notifier).state =
                          selectedDate.subtract(const Duration(days: 7));
                    },
                  ),
                  Expanded(
                    child: Center(
                      child: Text(
                        'Semaine du ${_getStartOfWeek(selectedDate).toFormattedDate()}',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.chevronRight),
                    onPressed: () {
                      ref.read(selectedDateProvider.notifier).state =
                          selectedDate.add(const Duration(days: 7));
                    },
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: () {
                      ref.read(selectedDateProvider.notifier).state =
                          DateTime.now();
                    },
                    icon: const Icon(LucideIcons.calendar),
                    label: const Text('Aujourd\'hui'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Calendar View
          Expanded(
            child: leconsAsync.when(
              data: (lecons) {
                return _buildWeekView(context, selectedDate, lecons);
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
    );
  }

  DateTime _getStartOfWeek(DateTime date) {
    return date.subtract(Duration(days: date.weekday - 1));
  }

  Widget _buildWeekView(BuildContext context, DateTime selectedDate, List<Lecon> lecons) {
    final startOfWeek = _getStartOfWeek(selectedDate);
    final days = List.generate(7, (index) => startOfWeek.add(Duration(days: index)));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Day Headers
            Row(
              children: days.map((day) {
                final isToday = day.isSameDay(DateTime.now());
                return Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: isToday ? AppColors.primary.withOpacity(0.1) : null,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        Text(
                          _getDayName(day.weekday),
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: isToday ? AppColors.primary : AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          '${day.day}',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: isToday ? AppColors.primary : AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const Divider(),

            // Lessons Grid
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: days.map((day) {
                  final dayLecons = lecons.where((l) => l.dateHeureDebut.isSameDay(day)).toList();
                  dayLecons.sort((a, b) => a.dateHeureDebut.compareTo(b.dateHeureDebut));

                  return Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      child: dayLecons.isEmpty
                          ? Center(
                              child: Text(
                                'Aucune leçon',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: AppColors.textTertiary,
                                    ),
                              ),
                            )
                          : ListView.builder(
                              itemCount: dayLecons.length,
                              itemBuilder: (context, index) {
                                final lecon = dayLecons[index];
                                return _buildLeconCard(context, lecon);
                              },
                            ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLeconCard(BuildContext context, Lecon lecon) {
    Color statusColor;
    switch (lecon.statut) {
      case 'effectue':
        statusColor = AppColors.success;
        break;
      case 'annule':
        statusColor = AppColors.error;
        break;
      case 'reporte':
        statusColor = AppColors.warning;
        break;
      default:
        statusColor = AppColors.info;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: statusColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.clock, size: 14, color: statusColor),
              const SizedBox(width: 4),
              Text(
                lecon.dateHeureDebut.toFormattedTime(),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: statusColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            lecon.moniteurNom ?? 'Moniteur N/A',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (lecon.themeAborde != null) ...[
            const SizedBox(height: 2),
            Text(
              lecon.themeAborde!,
              style: Theme.of(context).textTheme.bodySmall,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  String _getDayName(int weekday) {
    switch (weekday) {
      case 1:
        return 'Lun';
      case 2:
        return 'Mar';
      case 3:
        return 'Mer';
      case 4:
        return 'Jeu';
      case 5:
        return 'Ven';
      case 6:
        return 'Sam';
      case 7:
        return 'Dim';
      default:
        return '';
    }
  }
}

