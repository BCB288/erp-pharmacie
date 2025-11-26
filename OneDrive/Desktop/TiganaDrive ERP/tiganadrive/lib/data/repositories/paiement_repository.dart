import '../models/paiement.dart';
import '../supabase_client.dart';

class PaiementRepository {
  final _supabase = SupabaseService.instance;

  Future<List<Paiement>> getAll({
    String? agenceId,
    String? contratId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      var query = _supabase.from('paiements').select();

      if (agenceId != null) {
        query = query.eq('agence_id', agenceId);
      }

      if (contratId != null) {
        query = query.eq('contrat_id', contratId);
      }

      if (startDate != null) {
        query = query.gte('date_paiement', startDate.toIso8601String());
      }

      if (endDate != null) {
        query = query.lte('date_paiement', endDate.toIso8601String());
      }

      final response = await query.order('date_paiement', ascending: false);

      return (response as List)
          .map((json) => Paiement.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des paiements: $e');
    }
  }

  Future<Paiement?> getById(String id) async {
    try {
      final response = await _supabase
          .from('paiements')
          .select()
          .eq('id', id)
          .maybeSingle();

      return response != null ? Paiement.fromJson(response) : null;
    } catch (e) {
      throw Exception('Erreur lors de la récupération du paiement: $e');
    }
  }

  Future<double> getTotalByContrat(String contratId) async {
    try {
      final response = await _supabase
          .from('paiements')
          .select('montant')
          .eq('contrat_id', contratId);

      if (response.isNotEmpty) {
        return response.fold<double>(
          0,
          (sum, item) => sum + (item['montant'] as num).toDouble(),
        );
      }
      return 0;
    } catch (e) {
      throw Exception('Erreur lors du calcul du total des paiements: $e');
    }
  }

  Future<double> getTotalByAgence(
    String agenceId, {
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      var query = _supabase
          .from('paiements')
          .select('montant')
          .eq('agence_id', agenceId);

      if (startDate != null) {
        query = query.gte('date_paiement', startDate.toIso8601String());
      }

      if (endDate != null) {
        query = query.lte('date_paiement', endDate.toIso8601String());
      }

      final response = await query;

      if (response.isNotEmpty) {
        return response.fold<double>(
          0,
          (sum, item) => sum + (item['montant'] as num).toDouble(),
        );
      }
      return 0;
    } catch (e) {
      throw Exception('Erreur lors du calcul du total des paiements: $e');
    }
  }

  Future<Paiement> create(Paiement paiement) async {
    try {
      final response = await _supabase
          .from('paiements')
          .insert(paiement.toJson())
          .select()
          .single();

      return Paiement.fromJson(response);
    } catch (e) {
      throw Exception('Erreur lors de la création du paiement: $e');
    }
  }

  Future<Paiement> update(String id, Paiement paiement) async {
    try {
      final response = await _supabase
          .from('paiements')
          .update(paiement.toJson())
          .eq('id', id)
          .select()
          .single();

      return Paiement.fromJson(response);
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour du paiement: $e');
    }
  }

  Future<void> delete(String id) async {
    try {
      await _supabase.from('paiements').delete().eq('id', id);
    } catch (e) {
      throw Exception('Erreur lors de la suppression du paiement: $e');
    }
  }
}

