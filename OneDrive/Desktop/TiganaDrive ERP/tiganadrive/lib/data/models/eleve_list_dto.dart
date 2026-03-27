import 'eleve.dart';

/// Énumération pour le statut financier d'un élève
enum StatutFinancier {
  paye,
  partiel,
  impaye,
}

/// DTO (Data Transfer Object) pour l'affichage enrichi de la liste des élèves
/// Contient les informations de l'élève + des données agrégées (finance, progression)
class EleveListDTO {
  final Eleve eleve;
  final StatutFinancier statutFinancier;
  final double progression; // 0.0 à 1.0
  final double montantTotal;
  final double montantPaye;
  final double montantRestant;
  final int heuresEffectuees;
  final int heuresPrevues;
  final String? categoriePermis;
  final DateTime? prochainExamen;

  EleveListDTO({
    required this.eleve,
    required this.statutFinancier,
    required this.progression,
    required this.montantTotal,
    required this.montantPaye,
    required this.montantRestant,
    required this.heuresEffectuees,
    required this.heuresPrevues,
    this.categoriePermis,
    this.prochainExamen,
  });

  /// Constructeur factory pour créer un DTO à partir de données brutes
  factory EleveListDTO.fromAggregatedData({
    required Eleve eleve,
    required double montantTotal,
    required double montantPaye,
    required int heuresEffectuees,
    required int heuresPrevues,
    String? categoriePermis,
    DateTime? prochainExamen,
  }) {
    final montantRestant = montantTotal - montantPaye;
    
    // Déterminer le statut financier
    StatutFinancier statutFinancier;
    if (montantRestant <= 0) {
      statutFinancier = StatutFinancier.paye;
    } else if (montantPaye > 0) {
      statutFinancier = StatutFinancier.partiel;
    } else {
      statutFinancier = StatutFinancier.impaye;
    }

    // Calculer la progression (éviter division par zéro)
    final progression = heuresPrevues > 0 
        ? (heuresEffectuees / heuresPrevues).clamp(0.0, 1.0)
        : 0.0;

    return EleveListDTO(
      eleve: eleve,
      statutFinancier: statutFinancier,
      progression: progression,
      montantTotal: montantTotal,
      montantPaye: montantPaye,
      montantRestant: montantRestant,
      heuresEffectuees: heuresEffectuees,
      heuresPrevues: heuresPrevues,
      categoriePermis: categoriePermis,
      prochainExamen: prochainExamen,
    );
  }

  /// Constructeur simple pour les élèves sans contrat
  factory EleveListDTO.withoutContract(Eleve eleve) {
    return EleveListDTO(
      eleve: eleve,
      statutFinancier: StatutFinancier.impaye,
      progression: 0.0,
      montantTotal: 0.0,
      montantPaye: 0.0,
      montantRestant: 0.0,
      heuresEffectuees: 0,
      heuresPrevues: 0,
    );
  }

  /// Getter pour vérifier si l'élève est prêt pour l'examen
  bool get isPretPourExamen => progression >= 0.9 && heuresEffectuees >= heuresPrevues;

  /// Getter pour vérifier si le dossier est incomplet
  bool get isDossierIncomplet {
    return eleve.telephone == null ||
        eleve.email == null ||
        eleve.dateNaissance == null ||
        eleve.adresse == null;
  }
}

