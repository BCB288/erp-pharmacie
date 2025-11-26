import '../models/lecon.dart';
import '../supabase_client.dart';

class LeconRepository {
  final _supabase = SupabaseService.instance;

  Future<List<Lecon>> getAll({
    String? contratId,
    String? moniteurId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      var query = _supabase.from('lecons').select();

      if (contratId != null) {
        query = query.eq('contrat_id', contratId);
      }

      if (moniteurId != null) {
        query = query.eq('moniteur_id', moniteurId);
      }

      if (startDate != null) {
        query = query.gte('date_heure_debut', startDate.toIso8601String());
      }

      if (endDate != null) {
        query = query.lte('date_heure_debut', endDate.toIso8601String());
      }

      final response = await query.order('date_heure_debut', ascending: false);

      return (response as List).map((json) => Lecon.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des leçons: $e');
    }
  }

  Future<Lecon?> getById(String id) async {
    try {
      final response = await _supabase
          .from('lecons')
          .select()
          .eq('id', id)
          .maybeSingle();

      return response != null ? Lecon.fromJson(response) : null;
    } catch (e) {
      throw Exception('Erreur lors de la récupération de la leçon: $e');
    }
  }

  Future<List<Lecon>> getByDate(DateTime date, {String? moniteurId}) async {
    try {
      final startOfDay = DateTime(date.year, date.month, date.day);
      final endOfDay = startOfDay.add(const Duration(days: 1));

      var query = _supabase
          .from('lecons')
          .select()
          .gte('date_heure_debut', startOfDay.toIso8601String())
          .lt('date_heure_debut', endOfDay.toIso8601String());

      if (moniteurId != null) {
        query = query.eq('moniteur_id', moniteurId);
      }

      final response = await query.order('date_heure_debut', ascending: true);

      return (response as List).map((json) => Lecon.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des leçons du jour: $e');
    }
  }

  Future<int> countByContrat(String contratId, {String? statut}) async {
    try {
      var query = _supabase
          .from('lecons')
          .select('id')
          .eq('contrat_id', contratId);

      if (statut != null) {
        query = query.eq('statut', statut);
      }

      final response = await query;
      return (response as List).length;
    } catch (e) {
      throw Exception('Erreur lors du comptage des leçons: $e');
    }
  }

  Future<Lecon> create(Lecon lecon) async {
    try {
      final response = await _supabase
          .from('lecons')
          .insert(lecon.toJson())
          .select()
          .single();

      return Lecon.fromJson(response);
    } catch (e) {
      throw Exception('Erreur lors de la création de la leçon: $e');
    }
  }

  Future<Lecon> update(String id, Lecon lecon) async {
    try {
      final response = await _supabase
          .from('lecons')
          .update(lecon.toJson())
          .eq('id', id)
          .select()
          .single();

      return Lecon.fromJson(response);
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour de la leçon: $e');
    }
  }

  Future<void> delete(String id) async {
    try {
      await _supabase.from('lecons').delete().eq('id', id);
    } catch (e) {
      throw Exception('Erreur lors de la suppression de la leçon: $e');
    }
  }
}

