import '../models/eleve.dart';
import '../models/eleve_list_dto.dart';
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
      final json = eleve.toJson();
      if (eleve.id.isEmpty) {
        json.remove('id');
      }
      
      final response = await _supabase
          .from('eleves')
          .insert(json)
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

  /// Récupère la liste enrichie des élèves avec leurs données agrégées
  /// (progression, finance, etc.)
  Future<List<EleveListDTO>> getAllEnriched({
    String? agenceId,
    String? statut,
  }) async {
    try {
      // Récupérer tous les élèves
      final eleves = await getAll(agenceId: agenceId, statut: statut);
      
      // Pour chaque élève, récupérer ses données agrégées
      final List<EleveListDTO> enrichedList = [];
      
      for (final eleve in eleves) {
        // Récupérer le contrat actif de l'élève
        final contratsResponse = await _supabase
            .from('contrats')
            .select()
            .eq('eleve_id', eleve.id)
            .eq('statut', 'actif')
            .order('created_at', ascending: false)
            .limit(1);

        if (contratsResponse.isEmpty) {
          // Pas de contrat actif
          enrichedList.add(EleveListDTO.withoutContract(eleve));
          continue;
        }

        final contrat = contratsResponse.first;
        final contratId = contrat['id'] as String;
        final prixForfait = (contrat['prix_forfait'] as num?)?.toDouble() ?? 0.0;
        final remise = (contrat['remise'] as num?)?.toDouble() ?? 0.0;
        final montantTotal = prixForfait - remise;
        final heuresPrevues = contrat['nombre_heures_prevues'] as int? ?? 0;
        final categoriePermis = contrat['categorie_permis'] as String?;

        // Récupérer les paiements
        final paiementsResponse = await _supabase
            .from('paiements')
            .select('montant')
            .eq('contrat_id', contratId);

        final montantPaye = (paiementsResponse as List).fold<double>(
          0.0,
          (sum, p) => sum + ((p['montant'] as num?)?.toDouble() ?? 0.0),
        );

        // Récupérer les leçons effectuées
        final leconsResponse = await _supabase
            .from('lecons')
            .select('duree_minutes')
            .eq('contrat_id', contratId)
            .eq('statut', 'effectue');

        final minutesEffectuees = (leconsResponse as List).fold<int>(
          0,
          (sum, l) => sum + ((l['duree_minutes'] as int?) ?? 0),
        );
        final heuresEffectuees = (minutesEffectuees / 60).floor();

        // Récupérer le prochain examen
        final examensResponse = await _supabase
            .from('examens')
            .select('date_examen')
            .eq('contrat_id', contratId)
            .gte('date_examen', DateTime.now().toIso8601String().split('T')[0])
            .order('date_examen', ascending: true)
            .limit(1);

        DateTime? prochainExamen;
        if (examensResponse.isNotEmpty) {
          final dateStr = examensResponse.first['date_examen'] as String?;
          if (dateStr != null) {
            prochainExamen = DateTime.parse(dateStr);
          }
        }

        enrichedList.add(EleveListDTO.fromAggregatedData(
          eleve: eleve,
          montantTotal: montantTotal,
          montantPaye: montantPaye,
          heuresEffectuees: heuresEffectuees,
          heuresPrevues: heuresPrevues,
          categoriePermis: categoriePermis,
          prochainExamen: prochainExamen,
        ));
      }

      return enrichedList;
    } catch (e) {
      throw Exception('Erreur lors de la récupération des élèves enrichis: $e');
    }
  }

  /// Récupère les statistiques globales des élèves pour une agence
  Future<Map<String, int>> getStatsByAgence(String agenceId) async {
    try {
      // Total des élèves
      final total = await countByAgence(agenceId);
      
      // Élèves actifs (en formation)
      final actifs = await countByAgence(agenceId, statut: 'en_formation');
      
      // Permis obtenus
      final permisObtenus = await countByAgence(agenceId, statut: 'permis_obtenu');
      
      // Abandons
      final abandons = await countByAgence(agenceId, statut: 'abandon');

      return {
        'total': total,
        'actifs': actifs,
        'permis_obtenus': permisObtenus,
        'abandons': abandons,
      };
    } catch (e) {
      throw Exception('Erreur lors de la récupération des statistiques: $e');
    }
  }
}

