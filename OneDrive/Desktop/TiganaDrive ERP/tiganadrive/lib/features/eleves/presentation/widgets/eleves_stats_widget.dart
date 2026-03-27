import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';

/// Widget affichant les statistiques des élèves sous forme de cartes
class ElevesStatsWidget extends StatelessWidget {
  final int totalEleves;
  final int elevesActifs;
  final int pretsPourExamen;
  final int dossiersIncomplets;

  const ElevesStatsWidget({
    super.key,
    required this.totalEleves,
    required this.elevesActifs,
    required this.pretsPourExamen,
    required this.dossiersIncomplets,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            title: 'Total Élèves',
            value: totalEleves.toString(),
            icon: LucideIcons.users,
            color: AppColors.primary,
            backgroundColor: AppColors.primary.withOpacity(0.1),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _StatCard(
            title: 'Élèves Actifs',
            value: elevesActifs.toString(),
            icon: LucideIcons.bookOpen,
            color: AppColors.success,
            backgroundColor: AppColors.success.withOpacity(0.1),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _StatCard(
            title: 'Prêts pour Examen',
            value: pretsPourExamen.toString(),
            icon: LucideIcons.award,
            color: AppColors.warning,
            backgroundColor: AppColors.warning.withOpacity(0.1),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _StatCard(
            title: 'Dossiers Incomplets',
            value: dossiersIncomplets.toString(),
            icon: Icons.error_outline,
            color: AppColors.error,
            backgroundColor: AppColors.error.withOpacity(0.1),
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final Color backgroundColor;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: backgroundColor,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    icon,
                    color: color,
                    size: 24,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

