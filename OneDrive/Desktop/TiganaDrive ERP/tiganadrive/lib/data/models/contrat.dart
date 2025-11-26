class Contrat {
  final String id;
  final String? eleveId;
  final String? agenceId;
  final String categoriePermis;
  final String typeFormation;
  final int nombreHeuresPrevues;
  final double prixForfait;
  final double remise;
  final DateTime? dateInscription;
  final DateTime? dateFinPrevue;
  final String statut;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Contrat({
    required this.id,
    this.eleveId,
    this.agenceId,
    required this.categoriePermis,
    this.typeFormation = 'classique',
    this.nombreHeuresPrevues = 20,
    required this.prixForfait,
    this.remise = 0,
    this.dateInscription,
    this.dateFinPrevue,
    this.statut = 'actif',
    this.createdAt,
    this.updatedAt,
  });

  double get montantTotal => prixForfait - remise;

  factory Contrat.fromJson(Map<String, dynamic> json) {
    return Contrat(
      id: json['id'] as String,
      eleveId: json['eleve_id'] as String?,
      agenceId: json['agence_id'] as String?,
      categoriePermis: json['categorie_permis'] as String,
      typeFormation: json['type_formation'] as String? ?? 'classique',
      nombreHeuresPrevues: json['nombre_heures_prevues'] as int? ?? 20,
      prixForfait: (json['prix_forfait'] as num).toDouble(),
      remise: (json['remise'] as num?)?.toDouble() ?? 0,
      dateInscription: json['date_inscription'] != null
          ? DateTime.parse(json['date_inscription'] as String)
          : null,
      dateFinPrevue: json['date_fin_prevue'] != null
          ? DateTime.parse(json['date_fin_prevue'] as String)
          : null,
      statut: json['statut'] as String? ?? 'actif',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eleve_id': eleveId,
      'agence_id': agenceId,
      'categorie_permis': categoriePermis,
      'type_formation': typeFormation,
      'nombre_heures_prevues': nombreHeuresPrevues,
      'prix_forfait': prixForfait,
      'remise': remise,
      'date_inscription': dateInscription?.toIso8601String().split('T')[0],
      'date_fin_prevue': dateFinPrevue?.toIso8601String().split('T')[0],
      'statut': statut,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Contrat copyWith({
    String? id,
    String? eleveId,
    String? agenceId,
    String? categoriePermis,
    String? typeFormation,
    int? nombreHeuresPrevues,
    double? prixForfait,
    double? remise,
    DateTime? dateInscription,
    DateTime? dateFinPrevue,
    String? statut,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Contrat(
      id: id ?? this.id,
      eleveId: eleveId ?? this.eleveId,
      agenceId: agenceId ?? this.agenceId,
      categoriePermis: categoriePermis ?? this.categoriePermis,
      typeFormation: typeFormation ?? this.typeFormation,
      nombreHeuresPrevues: nombreHeuresPrevues ?? this.nombreHeuresPrevues,
      prixForfait: prixForfait ?? this.prixForfait,
      remise: remise ?? this.remise,
      dateInscription: dateInscription ?? this.dateInscription,
      dateFinPrevue: dateFinPrevue ?? this.dateFinPrevue,
      statut: statut ?? this.statut,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

