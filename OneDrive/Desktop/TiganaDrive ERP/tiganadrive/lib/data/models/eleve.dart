class Eleve {
  final String id;
  final String? agenceId;
  final String nom;
  final String prenom;
  final DateTime? dateNaissance;
  final String? telephone;
  final String? email;
  final String? adresse;
  final String? photoUrl;
  final String statut;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Eleve({
    required this.id,
    this.agenceId,
    required this.nom,
    required this.prenom,
    this.dateNaissance,
    this.telephone,
    this.email,
    this.adresse,
    this.photoUrl,
    this.statut = 'inscrit',
    this.createdAt,
    this.updatedAt,
  });

  String get nomComplet => '$prenom $nom';

  factory Eleve.fromJson(Map<String, dynamic> json) {
    return Eleve(
      id: json['id'] as String,
      agenceId: json['agence_id'] as String?,
      nom: json['nom'] as String,
      prenom: json['prenom'] as String,
      dateNaissance: json['date_naissance'] != null
          ? DateTime.parse(json['date_naissance'] as String)
          : null,
      telephone: json['telephone'] as String?,
      email: json['email'] as String?,
      adresse: json['adresse'] as String?,
      photoUrl: json['photo_url'] as String?,
      statut: json['statut'] as String? ?? 'inscrit',
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
      'agence_id': agenceId,
      'nom': nom,
      'prenom': prenom,
      'date_naissance': dateNaissance?.toIso8601String().split('T')[0],
      'telephone': telephone,
      'email': email,
      'adresse': adresse,
      'photo_url': photoUrl,
      'statut': statut,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Eleve copyWith({
    String? id,
    String? agenceId,
    String? nom,
    String? prenom,
    DateTime? dateNaissance,
    String? telephone,
    String? email,
    String? adresse,
    String? photoUrl,
    String? statut,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Eleve(
      id: id ?? this.id,
      agenceId: agenceId ?? this.agenceId,
      nom: nom ?? this.nom,
      prenom: prenom ?? this.prenom,
      dateNaissance: dateNaissance ?? this.dateNaissance,
      telephone: telephone ?? this.telephone,
      email: email ?? this.email,
      adresse: adresse ?? this.adresse,
      photoUrl: photoUrl ?? this.photoUrl,
      statut: statut ?? this.statut,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

