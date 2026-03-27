import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:data_table_2/data_table_2.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/agence_provider.dart';
import '../../../core/utils/extensions.dart';
import '../../../data/repositories/eleve_repository.dart';
import '../../../data/models/eleve_list_dto.dart';
import 'widgets/eleves_stats_widget.dart';
import 'widgets/eleve_form_widget.dart';

final eleveRepositoryProvider = Provider((ref) => EleveRepository());

final eleveListEnrichedProvider = FutureProvider.autoDispose((ref) async {
  final agenceId = ref.watch(selectedAgenceIdProvider);
  if (agenceId == null) return <EleveListDTO>[];

  final eleveRepo = ref.watch(eleveRepositoryProvider);
  return eleveRepo.getAllEnriched(agenceId: agenceId);
});

final eleveStatsProvider = FutureProvider.autoDispose((ref) async {
  final agenceId = ref.watch(selectedAgenceIdProvider);
  if (agenceId == null) {
    return {
      'total': 0,
      'actifs': 0,
      'permis_obtenus': 0,
      'abandons': 0,
    };
  }

  final eleveRepo = ref.watch(eleveRepositoryProvider);
  return eleveRepo.getStatsByAgence(agenceId);
});

class ElevesListPageNew extends ConsumerStatefulWidget {
  const ElevesListPageNew({super.key});

  @override
  ConsumerState<ElevesListPageNew> createState() => _ElevesListPageNewState();
}

class _ElevesListPageNewState extends ConsumerState<ElevesListPageNew> {
  String _searchQuery = '';
  String? _selectedStatut;
  String? _selectedPermis;

  @override
  Widget build(BuildContext context) {
    final elevesAsync = ref.watch(eleveListEnrichedProvider);
    final statsAsync = ref.watch(eleveStatsProvider);

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
                      'Gérez vos élèves, leurs documents et leur progression',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              OutlinedButton.icon(
                onPressed: () {
                  // TODO: Implémenter l'export
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Fonctionnalité à venir')),
                  );
                },
                icon: const Icon(LucideIcons.download),
                label: const Text('Exporter'),
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                onPressed: () {
                  // TODO: Implémenter l'impression
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Fonctionnalité à venir')),
                  );
                },
                icon: const Icon(LucideIcons.printer),
                label: const Text('Imprimer'),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: () {
                  _showAddEleveDialog(context);
                },
                icon: const Icon(LucideIcons.plus),
                label: const Text('Nouvel Élève'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF8C00),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Stats Cards
          statsAsync.when(
            data: (stats) {
              return ElevesStatsWidget(
                totalEleves: stats['total'] ?? 0,
                elevesActifs: stats['actifs'] ?? 0,
                pretsPourExamen: 0, // Sera calculé depuis les DTOs
                dossiersIncomplets: 0, // Sera calculé depuis les DTOs
              );
            },
            loading: () => const SizedBox(height: 120),
            error: (_, __) => const SizedBox(height: 120),
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
                      decoration: InputDecoration(
                        hintText: 'Chercher un élève...',
                        prefixIcon: const Icon(LucideIcons.search),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                      onChanged: (value) {
                        setState(() => _searchQuery = value.toLowerCase());
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      decoration: InputDecoration(
                        labelText: 'Tous les statuts',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                      value: _selectedStatut,
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
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      decoration: InputDecoration(
                        labelText: 'Tous les permis',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                      value: _selectedPermis,
                      items: const [
                        DropdownMenuItem(value: null, child: Text('Tous')),
                        DropdownMenuItem(value: 'A', child: Text('Permis A')),
                        DropdownMenuItem(value: 'B', child: Text('Permis B')),
                        DropdownMenuItem(value: 'C', child: Text('Permis C')),
                        DropdownMenuItem(value: 'D', child: Text('Permis D')),
                      ],
                      onChanged: (value) {
                        setState(() => _selectedPermis = value);
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton.icon(
                    onPressed: () {
                      ref.invalidate(eleveListEnrichedProvider);
                    },
                    icon: const Icon(LucideIcons.filter),
                    label: const Text('Filtrer'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 16,
                      ),
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
                data: (eleveDTOs) {
                  // Apply filters
                  var filteredEleves = eleveDTOs.where((dto) {
                    final matchesSearch = _searchQuery.isEmpty ||
                        dto.eleve.nomComplet
                            .toLowerCase()
                            .contains(_searchQuery) ||
                        (dto.eleve.telephone
                                ?.toLowerCase()
                                .contains(_searchQuery) ??
                            false) ||
                        (dto.eleve.email?.toLowerCase().contains(_searchQuery) ??
                            false);

                    final matchesStatut = _selectedStatut == null ||
                        dto.eleve.statut == _selectedStatut;

                    final matchesPermis = _selectedPermis == null ||
                        dto.categoriePermis == _selectedPermis;

                    return matchesSearch && matchesStatut && matchesPermis;
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
                    minWidth: 1200,
                    headingRowColor: MaterialStateProperty.all(
                      AppColors.borderLight.withOpacity(0.3),
                    ),
                    columns: const [
                      DataColumn2(
                        label: Text('Nom & Prénom'),
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
                        label: Text('Type de permis'),
                        size: ColumnSize.S,
                      ),
                      DataColumn2(
                        label: Text('Statut'),
                        size: ColumnSize.S,
                      ),
                      DataColumn2(
                        label: Text('Formation'),
                        size: ColumnSize.L,
                      ),
                      DataColumn2(
                        label: Text('Solde'),
                        size: ColumnSize.M,
                      ),
                      DataColumn2(
                        label: Text('Actions'),
                        size: ColumnSize.S,
                      ),
                    ],
                    rows: filteredEleves.map((dto) {
                      return DataRow2(
                        onTap: () => context.go('/eleves/${dto.eleve.id}'),
                        cells: [
                          DataCell(
                            Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: AppColors.primary,
                                  child: Text(
                                    dto.eleve.initiales,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        dto.eleve.nomComplet,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text(
                                        'AED-${dto.eleve.id.substring(0, 8).toUpperCase()}',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          DataCell(Text(dto.eleve.telephone ?? 'N/A')),
                          DataCell(Text(dto.eleve.email ?? 'N/A')),
                          DataCell(
                            dto.categoriePermis != null
                                ? Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      'Permis ${dto.categoriePermis}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  )
                                : const Text('N/A'),
                          ),
                          DataCell(_buildStatutChip(dto.eleve.statut)),
                          DataCell(_buildProgressBar(dto)),
                          DataCell(_buildSoldeChip(dto)),
                          DataCell(
                            PopupMenuButton<String>(
                              icon: const Icon(Icons.more_vert, size: 18),
                              onSelected: (value) {
                                switch (value) {
                                  case 'voir':
                                    context.go('/eleves/${dto.eleve.id}');
                                    break;
                                  case 'modifier':
                                    // TODO: Ouvrir dialog de modification
                                    break;
                                  case 'supprimer':
                                    // TODO: Confirmer et supprimer
                                    break;
                                }
                              },
                              itemBuilder: (context) => [
                                const PopupMenuItem(
                                  value: 'voir',
                                  child: Row(
                                    children: [
                                      Icon(LucideIcons.eye, size: 16),
                                      SizedBox(width: 8),
                                      Text('Voir détails'),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem(
                                  value: 'modifier',
                                  child: Row(
                                    children: [
                                      Icon(LucideIcons.pencil, size: 16),
                                      SizedBox(width: 8),
                                      Text('Modifier'),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem(
                                  value: 'supprimer',
                                  child: Row(
                                    children: [
                                      Icon(LucideIcons.trash2, size: 16),
                                      SizedBox(width: 8),
                                      Text('Supprimer'),
                                    ],
                                  ),
                                ),
                              ],
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
        label = 'Actif';
        break;
      case 'permis_obtenu':
        color = AppColors.success;
        label = 'Complet';
        break;
      case 'abandon':
        color = AppColors.error;
        label = 'Suspendu';
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

  Widget _buildProgressBar(EleveListDTO dto) {
    final percentage = (dto.progression * 100).toInt();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(
          children: [
            Expanded(
              child: LinearProgressIndicator(
                value: dto.progression,
                backgroundColor: AppColors.borderLight,
                valueColor: AlwaysStoppedAnimation<Color>(
                  dto.progression >= 0.9
                      ? AppColors.success
                      : const Color(0xFFFF8C00),
                ),
                minHeight: 6,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '$percentage%',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          '${dto.heuresEffectuees}h / ${dto.heuresPrevues}h',
          style: TextStyle(
            fontSize: 10,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildSoldeChip(EleveListDTO dto) {
    Color color;
    String label;

    switch (dto.statutFinancier) {
      case StatutFinancier.paye:
        color = AppColors.success;
        label = 'Payé';
        break;
      case StatutFinancier.partiel:
        color = const Color(0xFFFF8C00);
        label = 'Partiel';
        break;
      case StatutFinancier.impaye:
        color = AppColors.error;
        label = 'Non payé';
        break;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
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
        ),
        if (dto.montantRestant > 0) ...[
          const SizedBox(height: 2),
          Text(
            dto.montantRestant.toCurrency(),
            style: TextStyle(
              fontSize: 10,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ],
    );
  }

  void _showAddEleveDialog(BuildContext context) {
    final agenceId = ref.read(selectedAgenceIdProvider);
    
    if (agenceId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner une agence'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Container(
          width: 800,
          constraints: const BoxConstraints(maxHeight: 800),
          child: Column(
            children: [
              // Header du dialog
              Container(
                padding: const EdgeInsets.all(24),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(4),
                    topRight: Radius.circular(4),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.userPlus, color: Colors.white),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Text(
                        'Nouvel Élève',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x, color: Colors.white),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              // Formulaire
              Expanded(
                child: EleveFormWidget(
                  agenceId: agenceId,
                  onSuccess: () {
                    ref.invalidate(eleveListEnrichedProvider);
                    ref.invalidate(eleveStatsProvider);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

