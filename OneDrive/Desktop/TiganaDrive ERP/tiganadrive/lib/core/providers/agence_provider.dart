import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/agence.dart';
import '../../data/repositories/agence_repository.dart';

final agenceRepositoryProvider = Provider((ref) => AgenceRepository());

final agencesProvider = FutureProvider<List<Agence>>((ref) async {
  final repository = ref.watch(agenceRepositoryProvider);
  return repository.getAll();
});

final selectedAgenceIdProvider = StateProvider<String?>((ref) => null);

final selectedAgenceProvider = Provider<Agence?>((ref) {
  final agenceId = ref.watch(selectedAgenceIdProvider);
  if (agenceId == null) return null;

  final agencesAsync = ref.watch(agencesProvider);
  return agencesAsync.when(
    data: (agences) => agences.firstWhere(
      (a) => a.id == agenceId,
      orElse: () => agences.isNotEmpty ? agences.first : throw Exception('Aucune agence trouvée'),
    ),
    loading: () => null,
    error: (_, __) => null,
  );
});

