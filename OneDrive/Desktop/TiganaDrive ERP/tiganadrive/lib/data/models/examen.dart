class Examen {
  final String id;
  final String? contratId;
  final String typeExamen;
  final DateTime dateExamen;
  final String? resultat;
  final String? motifEchec;
  final String? examinateur;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Examen({
    required this.id,
    this.contratId,
    required this.typeExamen,
    required this.dateExamen,
    this.resultat,
    this.motifEchec,
    this.examinateur,
    this.createdAt,
    this.updatedAt,
  });

  bool get isReussi => resultat == 'reussi';

  factory Examen.fromJson(Map<String, dynamic> json) {
    return Examen(
      id: json['id'] as String,
      contratId: json['contrat_id'] as String?,
      typeExamen: json['type_examen'] as String,
      dateExamen: DateTime.parse(json['date_examen'] as String),
      resultat: json['resultat'] as String?,
      motifEchec: json['motif_echec'] as String?,
      examinateur: json['examinateur'] as String?,
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
      'type_examen': typeExamen,
      'date_examen': dateExamen.toIso8601String().split('T')[0],
      'resultat': resultat,
      'motif_echec': motifEchec,
      'examinateur': examinateur,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Examen copyWith({
    String? id,
    String? contratId,
    String? typeExamen,
    DateTime? dateExamen,
    String? resultat,
    String? motifEchec,
    String? examinateur,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Examen(
      id: id ?? this.id,
      contratId: contratId ?? this.contratId,
      typeExamen: typeExamen ?? this.typeExamen,
      dateExamen: dateExamen ?? this.dateExamen,
      resultat: resultat ?? this.resultat,
      motifEchec: motifEchec ?? this.motifEchec,
      examinateur: examinateur ?? this.examinateur,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

