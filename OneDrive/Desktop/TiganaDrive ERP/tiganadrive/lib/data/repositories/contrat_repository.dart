import '../models/contrat.dart';
import '../supabase_client.dart';

class ContratRepository {
  final _supabase = SupabaseService.instance;

  Future<List<Contrat>> getAll({String? agenceId, String? eleveId}) async {
    try {
      var query = _supabase.from('contrats').select();

      if (agenceId != null) {
        query = query.eq('agence_id', agenceId);
      }

      if (eleveId != null) {
        query = query.eq('eleve_id', eleveId);
      }

      final response = await query.order('created_at', ascending: false);

      return (response as List).map((json) => Contrat.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des contrats: $e');
    }
  }

  Future<Contrat?> getById(String id) async {
    try {
      final response = await _supabase
          .from('contrats')
          .select()
          .eq('id', id)
          .maybeSingle();

      return response != null ? Contrat.fromJson(response) : null;
    } catch (e) {
      throw Exception('Erreur lors de la récupération du contrat: $e');
    }
  }

  Future<Contrat?> getActiveByEleve(String eleveId) async {
    try {
      final response = await _supabase
          .from('contrats')
          .select()
          .eq('eleve_id', eleveId)
          .eq('statut', 'actif')
          .maybeSingle();

      return response != null ? Contrat.fromJson(response) : null;
    } catch (e) {
      throw Exception('Erreur lors de la récupération du contrat actif: $e');
    }
  }

  Future<Contrat> create(Contrat contrat) async {
    try {
      final response = await _supabase
          .from('contrats')
          .insert(contrat.toJson())
          .select()
          .single();

      return Contrat.fromJson(response);
    } catch (e) {
      throw Exception('Erreur lors de la création du contrat: $e');
    }
  }

  Future<Contrat> update(String id, Contrat contrat) async {
    try {
      final response = await _supabase
          .from('contrats')
          .update(contrat.toJson())
          .eq('id', id)
          .select()
          .single();

      return Contrat.fromJson(response);
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour du contrat: $e');
    }
  }

  Future<void> delete(String id) async {
    try {
      await _supabase.from('contrats').delete().eq('id', id);
    } catch (e) {
      throw Exception('Erreur lors de la suppression du contrat: $e');
    }
  }

  Future<int> countByAgence(String agenceId, {String? statut}) async {
    try {
      var query = _supabase
          .from('contrats')
          .select('id')
          .eq('agence_id', agenceId);

      if (statut != null) {
        query = query.eq('statut', statut);
      }

      final response = await query;
      return (response as List).length;
    } catch (e) {
      throw Exception('Erreur lors du comptage des contrats: $e');
    }
  }
}

