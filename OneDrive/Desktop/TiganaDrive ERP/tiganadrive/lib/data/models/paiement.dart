class Paiement {
  final String id;
  final String? contratId;
  final String? agenceId;
  final double montant;
  final DateTime datePaiement;
  final String? modePaiement;
  final String? referenceExterne;
  final String? recuNumero;
  final String? agentId;
  final String? observation;
  final DateTime? createdAt;

  Paiement({
    required this.id,
    this.contratId,
    this.agenceId,
    required this.montant,
    required this.datePaiement,
    this.modePaiement,
    this.referenceExterne,
    this.recuNumero,
    this.agentId,
    this.observation,
    this.createdAt,
  });

  factory Paiement.fromJson(Map<String, dynamic> json) {
    return Paiement(
      id: json['id'] as String,
      contratId: json['contrat_id'] as String?,
      agenceId: json['agence_id'] as String?,
      montant: (json['montant'] as num).toDouble(),
      datePaiement: DateTime.parse(json['date_paiement'] as String),
      modePaiement: json['mode_paiement'] as String?,
      referenceExterne: json['reference_externe'] as String?,
      recuNumero: json['recu_numero'] as String?,
      agentId: json['agent_id'] as String?,
      observation: json['observation'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'contrat_id': contratId,
      'agence_id': agenceId,
      'montant': montant,
      'date_paiement': datePaiement.toIso8601String(),
      'mode_paiement': modePaiement,
      'reference_externe': referenceExterne,
      'recu_numero': recuNumero,
      'agent_id': agentId,
      'observation': observation,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  Paiement copyWith({
    String? id,
    String? contratId,
    String? agenceId,
    double? montant,
    DateTime? datePaiement,
    String? modePaiement,
    String? referenceExterne,
    String? recuNumero,
    String? agentId,
    String? observation,
    DateTime? createdAt,
  }) {
    return Paiement(
      id: id ?? this.id,
      contratId: contratId ?? this.contratId,
      agenceId: agenceId ?? this.agenceId,
      montant: montant ?? this.montant,
      datePaiement: datePaiement ?? this.datePaiement,
      modePaiement: modePaiement ?? this.modePaiement,
      referenceExterne: referenceExterne ?? this.referenceExterne,
      recuNumero: recuNumero ?? this.recuNumero,
      agentId: agentId ?? this.agentId,
      observation: observation ?? this.observation,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

