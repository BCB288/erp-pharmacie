import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/providers/agence_provider.dart';
import '../../core/providers/auth_provider.dart';

class MainLayout extends ConsumerStatefulWidget {
  final Widget child;

  const MainLayout({super.key, required this.child});

  @override
  ConsumerState<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends ConsumerState<MainLayout> {
  int _selectedIndex = 0;
  bool _isExtended = true;

  final List<NavigationItem> _navigationItems = [
    NavigationItem(
      icon: LucideIcons.layoutDashboard,
      label: 'Tableau de bord',
      route: '/dashboard',
    ),
    NavigationItem(
      icon: LucideIcons.users,
      label: 'Élèves',
      route: '/eleves',
    ),
    NavigationItem(
      icon: LucideIcons.calendar,
      label: 'Planning',
      route: '/planning',
    ),
    NavigationItem(
      icon: LucideIcons.banknote,
      label: 'Finance',
      route: '/finance',
    ),
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _updateSelectedIndex();
  }

  void _updateSelectedIndex() {
    final location = GoRouterState.of(context).matchedLocation;
    for (var i = 0; i < _navigationItems.length; i++) {
      if (location.startsWith(_navigationItems[i].route)) {
        setState(() => _selectedIndex = i);
        break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final agencesAsync = ref.watch(agencesProvider);
    final selectedAgenceId = ref.watch(selectedAgenceIdProvider);
    final currentUser = ref.watch(currentUserProvider);

    return Scaffold(
      body: Row(
        children: [
          // Navigation Rail
          NavigationRail(
            extended: _isExtended && MediaQuery.of(context).size.width > 900,
            backgroundColor: AppColors.surface,
            selectedIndex: _selectedIndex,
            onDestinationSelected: (index) {
              setState(() => _selectedIndex = index);
              context.go(_navigationItems[index].route);
            },
            leading: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(
                children: [
                  Icon(
                    LucideIcons.car,
                    size: 32,
                    color: AppColors.primary,
                  ),
                  if (_isExtended && MediaQuery.of(context).size.width > 900)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        'TiganaDrive',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ),
                ],
              ),
            ),
            trailing: Expanded(
              child: Align(
                alignment: Alignment.bottomCenter,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: IconButton(
                    icon: Icon(
                      _isExtended ? LucideIcons.chevronsLeft : LucideIcons.chevronsRight,
                    ),
                    onPressed: () {
                      setState(() => _isExtended = !_isExtended);
                    },
                  ),
                ),
              ),
            ),
            destinations: _navigationItems
                .map(
                  (item) => NavigationRailDestination(
                    icon: Icon(item.icon),
                    selectedIcon: Icon(item.icon),
                    label: Text(item.label),
                  ),
                )
                .toList(),
          ),
          const VerticalDivider(thickness: 1, width: 1),

          // Main Content
          Expanded(
            child: Column(
              children: [
                // Top Bar
                Container(
                  height: 64,
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    border: Border(
                      bottom: BorderSide(color: AppColors.border),
                    ),
                  ),
                  child: Row(
                    children: [
                      // Breadcrumb ou titre
                      Text(
                        _navigationItems[_selectedIndex].label,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const Spacer(),

                      // Sélecteur d'agence
                      agencesAsync.when(
                        data: (agences) {
                          if (agences.isEmpty) {
                            return const SizedBox.shrink();
                          }

                          // Sélectionner la première agence par défaut
                          if (selectedAgenceId == null && agences.isNotEmpty) {
                            WidgetsBinding.instance.addPostFrameCallback((_) {
                              ref.read(selectedAgenceIdProvider.notifier).state =
                                  agences.first.id;
                            });
                          }

                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              border: Border.all(color: AppColors.border),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: DropdownButton<String>(
                              value: selectedAgenceId ?? agences.first.id,
                              underline: const SizedBox.shrink(),
                              icon: const Icon(LucideIcons.chevronsUpDown, size: 16),
                              items: agences.map((agence) {
                                return DropdownMenuItem(
                                  value: agence.id,
                                  child: Row(
                                    children: [
                                      const Icon(LucideIcons.building2, size: 16),
                                      const SizedBox(width: 8),
                                      Text(agence.nom),
                                    ],
                                  ),
                                );
                              }).toList(),
                              onChanged: (value) {
                                if (value != null) {
                                  ref.read(selectedAgenceIdProvider.notifier).state =
                                      value;
                                }
                              },
                            ),
                          );
                        },
                        loading: () => const CircularProgressIndicator(),
                        error: (_, __) => const Icon(Icons.error_outline),
                      ),

                      const SizedBox(width: 16),

                      // User Menu
                      PopupMenuButton<String>(
                        icon: CircleAvatar(
                          backgroundColor: AppColors.primary,
                          child: Text(
                            currentUser?.email?.substring(0, 1).toUpperCase() ?? 'U',
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                        itemBuilder: (context) => [
                          PopupMenuItem(
                            child: Row(
                              children: [
                                const Icon(LucideIcons.user, size: 16),
                                const SizedBox(width: 8),
                                Text(currentUser?.email ?? 'Utilisateur'),
                              ],
                            ),
                          ),
                          const PopupMenuDivider(),
                          const PopupMenuItem(
                            value: 'logout',
                            child: Row(
                              children: [
                                Icon(LucideIcons.logOut, size: 16),
                                SizedBox(width: 8),
                                Text('Déconnexion'),
                              ],
                            ),
                          ),
                        ],
                        onSelected: (value) {
                          if (value == 'logout') {
                            ref.read(authNotifierProvider.notifier).signOut();
                          }
                        },
                      ),
                    ],
                  ),
                ),

                // Content Area
                Expanded(
                  child: Container(
                    color: AppColors.background,
                    child: widget.child,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class NavigationItem {
  final IconData icon;
  final String label;
  final String route;

  NavigationItem({
    required this.icon,
    required this.label,
    required this.route,
  });
}

