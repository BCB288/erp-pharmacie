import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/presentation/login_page.dart';
import '../../features/dashboard/presentation/dashboard_page.dart';
import '../../features/eleves/presentation/eleves_list_page.dart';
import '../../features/eleves/presentation/eleve_detail_page.dart';
import '../../features/finance/presentation/finance_page.dart';
import '../../features/planning/presentation/planning_page.dart';
import '../../shared/widgets/main_layout.dart';
import '../providers/auth_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final isAuthenticated = ref.watch(isAuthenticatedProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      if (!isAuthenticated && state.matchedLocation != '/login') {
        return '/login';
      }
      if (isAuthenticated && state.matchedLocation == '/login') {
        return '/dashboard';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainLayout(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardPage(),
          ),
          GoRoute(
            path: '/eleves',
            builder: (context, state) => const ElevesListPage(),
          ),
          GoRoute(
            path: '/eleves/:id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return EleveDetailPage(eleveId: id);
            },
          ),
          GoRoute(
            path: '/planning',
            builder: (context, state) => const PlanningPage(),
          ),
          GoRoute(
            path: '/finance',
            builder: (context, state) => const FinancePage(),
          ),
        ],
      ),
    ],
  );
});

