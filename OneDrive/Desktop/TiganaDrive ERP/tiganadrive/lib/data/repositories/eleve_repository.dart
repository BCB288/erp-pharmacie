import '../models/eleve.dart';
import '../supabase_client.dart';

class EleveRepository {
  final _supabase = SupabaseService.instance;

  Future<List<Eleve>> getAll({String? agenceId, String? statut}) async {
    try {
      var query = _supabase.from('eleves').select();

      if (agenceId != null) {
        query = query.eq('agence_id', agenceId);
      }

      if (statut != null) {
        query = query.eq('statut', statut);
      }

      final response = await query.order('created_at', ascending: false);

      return (response as List).map((json) => Eleve.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des élèves: $e');
    }
  }

  Future<Eleve?> getById(String id) async {
    try {
      final response = await _supabase
          .from('eleves')
          .select()
          .eq('id', id)
          .maybeSingle();

      return response != null ? Eleve.fromJson(response) : null;
    } catch (e) {
      throw Exception('Erreur lors de la récupération de l\'élève: $e');
    }
  }

  Future<List<Eleve>> search(String query, {String? agenceId}) async {
    try {
      var supabaseQuery = _supabase.from('eleves').select();

      if (agenceId != null) {
        supabaseQuery = supabaseQuery.eq('agence_id', agenceId);
      }

      // Recherche sur nom, prénom, téléphone ou email
      supabaseQuery = supabaseQuery.or(
        'nom.ilike.%$query%,prenom.ilike.%$query%,telephone.ilike.%$query%,email.ilike.%$query%',
      );

      final response = await supabaseQuery.order('created_at', ascending: false);

      return (response as List).map((json) => Eleve.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Erreur lors de la recherche d\'élèves: $e');
    }
  }

  Future<Eleve> create(Eleve eleve) async {
    try {
      final response = await _supabase
          .from('eleves')
          .insert(eleve.toJson())
          .select()
          .single();

      return Eleve.fromJson(response);
    } catch (e) {
      throw Exception('Erreur lors de la création de l\'élève: $e');
    }
  }

  Future<Eleve> update(String id, Eleve eleve) async {
    try {
      final response = await _supabase
          .from('eleves')
          .update(eleve.toJson())
          .eq('id', id)
          .select()
          .single();

      return Eleve.fromJson(response);
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour de l\'élève: $e');
    }
  }

  Future<void> delete(String id) async {
    try {
      await _supabase.from('eleves').delete().eq('id', id);
    } catch (e) {
      throw Exception('Erreur lors de la suppression de l\'élève: $e');
    }
  }

  Future<int> countByAgence(String agenceId, {String? statut}) async {
    try {
      var query = _supabase
          .from('eleves')
          .select('id')
          .eq('agence_id', agenceId);

      if (statut != null) {
        query = query.eq('statut', statut);
      }

      final response = await query;
      return (response as List).length;
    } catch (e) {
      throw Exception('Erreur lors du comptage des élèves: $e');
    }
  }
}

