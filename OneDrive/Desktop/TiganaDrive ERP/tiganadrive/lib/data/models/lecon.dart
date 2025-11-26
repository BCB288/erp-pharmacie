class Lecon {
  final String id;
  final String? contratId;
  final String? moniteurId;
  final String? moniteurNom;
  final DateTime dateHeureDebut;
  final int dureeMinutes;
  final String? themeAborde;
  final String? progressionEleve;
  final String? observation;
  final String statut;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Lecon({
    required this.id,
    this.contratId,
    this.moniteurId,
    this.moniteurNom,
    required this.dateHeureDebut,
    this.dureeMinutes = 60,
    this.themeAborde,
    this.progressionEleve,
    this.observation,
    this.statut = 'planifie',
    this.createdAt,
    this.updatedAt,
  });

  DateTime get dateHeureFin =>
      dateHeureDebut.add(Duration(minutes: dureeMinutes));

  factory Lecon.fromJson(Map<String, dynamic> json) {
    return Lecon(
      id: json['id'] as String,
      contratId: json['contrat_id'] as String?,
      moniteurId: json['moniteur_id'] as String?,
      moniteurNom: json['moniteur_nom'] as String?,
      dateHeureDebut: DateTime.parse(json['date_heure_debut'] as String),
      dureeMinutes: json['duree_minutes'] as int? ?? 60,
      themeAborde: json['theme_aborde'] as String?,
      progressionEleve: json['progression_eleve'] as String?,
      observation: json['observation'] as String?,
      statut: json['statut'] as String? ?? 'planifie',
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
      'contrat_id': contratId,
      'moniteur_id': moniteurId,
      'moniteur_nom': moniteurNom,
      'date_heure_debut': dateHeureDebut.toIso8601String(),
      'duree_minutes': dureeMinutes,
      'theme_aborde': themeAborde,
      'progression_eleve': progressionEleve,
      'observation': observation,
      'statut': statut,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Lecon copyWith({
    String? id,
    String? contratId,
    String? moniteurId,
    String? moniteurNom,
    DateTime? dateHeureDebut,
    int? dureeMinutes,
    String? themeAborde,
    String? progressionEleve,
    String? observation,
    String? statut,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Lecon(
      id: id ?? this.id,
      contratId: contratId ?? this.contratId,
      moniteurId: moniteurId ?? this.moniteurId,
      moniteurNom: moniteurNom ?? this.moniteurNom,
      dateHeureDebut: dateHeureDebut ?? this.dateHeureDebut,
      dureeMinutes: dureeMinutes ?? this.dureeMinutes,
      themeAborde: themeAborde ?? this.themeAborde,
      progressionEleve: progressionEleve ?? this.progressionEleve,
      observation: observation ?? this.observation,
      statut: statut ?? this.statut,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

