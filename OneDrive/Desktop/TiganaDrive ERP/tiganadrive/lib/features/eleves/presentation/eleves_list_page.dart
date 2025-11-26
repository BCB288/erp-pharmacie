import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:data_table_2/data_table_2.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/agence_provider.dart';
import '../../../core/utils/extensions.dart';
import '../../../data/repositories/eleve_repository.dart';
import '../../../data/models/eleve.dart';

final eleveRepositoryProvider = Provider((ref) => EleveRepository());

final eleveListProvider = FutureProvider.autoDispose((ref) async {
  final agenceId = ref.watch(selectedAgenceIdProvider);
  if (agenceId == null) return <Eleve>[];

  final eleveRepo = ref.watch(eleveRepositoryProvider);
  return eleveRepo.getAll(agenceId: agenceId);
});

class ElevesListPage extends ConsumerStatefulWidget {
  const ElevesListPage({super.key});

  @override
  ConsumerState<ElevesListPage> createState() => _ElevesListPageState();
}

class _ElevesListPageState extends ConsumerState<ElevesListPage> {
  String _searchQuery = '';
  String? _selectedStatut;

  @override
  Widget build(BuildContext context) {
    final elevesAsync = ref.watch(eleveListProvider);

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
                      'Gestion des Élèves',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Liste complète des élèves inscrits',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  // TODO: Implémenter l'ajout d'élève
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Fonctionnalité à venir'),
                    ),
                  );
                },
                icon: const Icon(LucideIcons.plus),
                label: const Text('Nouvel Élève'),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Filters
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextField(
                      decoration: const InputDecoration(
                        hintText: 'Rechercher un élève...',
                        prefixIcon: Icon(LucideIcons.search),
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (value) {
                        setState(() => _searchQuery = value.toLowerCase());
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        labelText: 'Statut',
                        border: OutlineInputBorder(),
                      ),
                      initialValue: _selectedStatut,
                      items: const [
                        DropdownMenuItem(value: null, child: Text('Tous')),
                        DropdownMenuItem(value: 'inscrit', child: Text('Inscrit')),
                        DropdownMenuItem(
                          value: 'en_formation',
                          child: Text('En formation'),
                        ),
                        DropdownMenuItem(
                          value: 'permis_obtenu',
                          child: Text('Permis obtenu'),
                        ),
                        DropdownMenuItem(value: 'abandon', child: Text('Abandon')),
                      ],
                      onChanged: (value) {
                        setState(() => _selectedStatut = value);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Data Table
          Expanded(
            child: Card(
              child: elevesAsync.when(
                data: (eleves) {
                  // Apply filters
                  var filteredEleves = eleves.where((eleve) {
                    final matchesSearch = _searchQuery.isEmpty ||
                        eleve.nomComplet.toLowerCase().contains(_searchQuery) ||
                        (eleve.telephone?.toLowerCase().contains(_searchQuery) ??
                            false) ||
                        (eleve.email?.toLowerCase().contains(_searchQuery) ?? false);

                    final matchesStatut =
                        _selectedStatut == null || eleve.statut == _selectedStatut;

                    return matchesSearch && matchesStatut;
                  }).toList();

                  if (filteredEleves.isEmpty) {
                    return const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            LucideIcons.users,
                            size: 64,
                            color: AppColors.textTertiary,
                          ),
                          SizedBox(height: 16),
                          Text('Aucun élève trouvé'),
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
                        label: Text('Nom Complet'),
                        size: ColumnSize.L,
                      ),
                      DataColumn2(
                        label: Text('Téléphone'),
                        size: ColumnSize.M,
                      ),
                      DataColumn2(
                        label: Text('Email'),
                        size: ColumnSize.L,
                      ),
                      DataColumn2(
                        label: Text('Statut'),
                        size: ColumnSize.S,
                      ),
                      DataColumn2(
                        label: Text('Date d\'inscription'),
                        size: ColumnSize.M,
                      ),
                      DataColumn2(
                        label: Text('Actions'),
                        size: ColumnSize.S,
                      ),
                    ],
                    rows: filteredEleves.map((eleve) {
                      return DataRow2(
                        onTap: () => context.go('/eleves/${eleve.id}'),
                        cells: [
                          DataCell(
                            Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: AppColors.primary,
                                  child: Text(
                                    eleve.prenom[0].toUpperCase(),
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    eleve.nomComplet,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          DataCell(Text(eleve.telephone ?? 'N/A')),
                          DataCell(Text(eleve.email ?? 'N/A')),
                          DataCell(_buildStatutChip(eleve.statut)),
                          DataCell(
                            Text(
                              eleve.createdAt?.toFormattedDate() ?? 'N/A',
                            ),
                          ),
                          DataCell(
                            IconButton(
                              icon: const Icon(LucideIcons.externalLink, size: 18),
                              onPressed: () => context.go('/eleves/${eleve.id}'),
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
          ),
        ],
      ),
    );
  }

  Widget _buildStatutChip(String statut) {
    Color color;
    String label;

    switch (statut) {
      case 'inscrit':
        color = AppColors.info;
        label = 'Inscrit';
        break;
      case 'en_formation':
        color = AppColors.warning;
        label = 'En formation';
        break;
      case 'permis_obtenu':
        color = AppColors.success;
        label = 'Permis obtenu';
        break;
      case 'abandon':
        color = AppColors.error;
        label = 'Abandon';
        break;
      default:
        color = AppColors.textSecondary;
        label = statut;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

