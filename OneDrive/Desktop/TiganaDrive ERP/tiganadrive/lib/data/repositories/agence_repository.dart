import '../models/agence.dart';
import '../supabase_client.dart';

class AgenceRepository {
  final _supabase = SupabaseService.instance;

  Future<List<Agence>> getAll() async {
    try {
      final response = await _supabase
          .from('agences')
          .select()
          .order('nom', ascending: true);

      return (response as List)
          .map((json) => Agence.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des agences: $e');
    }
  }

  Future<Agence?> getById(String id) async {
    try {
      final response = await _supabase
          .from('agences')
          .select()
          .eq('id', id)
          .maybeSingle();

      return response != null ? Agence.fromJson(response) : null;
    } catch (e) {
      throw Exception('Erreur lors de la récupération de l\'agence: $e');
    }
  }

  Future<Agence> create(Agence agence) async {
    try {
      final response = await _supabase
          .from('agences')
          .insert(agence.toJson())
          .select()
          .single();

      return Agence.fromJson(response);
    } catch (e) {
      throw Exception('Erreur lors de la création de l\'agence: $e');
    }
  }

  Future<Agence> update(String id, Agence agence) async {
    try {
      final response = await _supabase
          .from('agences')
          .update(agence.toJson())
          .eq('id', id)
          .select()
          .single();

      return Agence.fromJson(response);
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour de l\'agence: $e');
    }
  }

  Future<void> delete(String id) async {
    try {
      await _supabase.from('agences').delete().eq('id', id);
    } catch (e) {
      throw Exception('Erreur lors de la suppression de l\'agence: $e');
    }
  }
}

