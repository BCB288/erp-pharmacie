class Agence {
  final String id;
  final String nom;
  final String? adresse;
  final String? telephone;
  final String? email;
  final String? nif;
  final String? logoUrl;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Agence({
    required this.id,
    required this.nom,
    this.adresse,
    this.telephone,
    this.email,
    this.nif,
    this.logoUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory Agence.fromJson(Map<String, dynamic> json) {
    return Agence(
      id: json['id'] as String,
      nom: json['nom'] as String,
      adresse: json['adresse'] as String?,
      telephone: json['telephone'] as String?,
      email: json['email'] as String?,
      nif: json['nif'] as String?,
      logoUrl: json['logo_url'] as String?,
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
      'nom': nom,
      'adresse': adresse,
      'telephone': telephone,
      'email': email,
      'nif': nif,
      'logo_url': logoUrl,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Agence copyWith({
    String? id,
    String? nom,
    String? adresse,
    String? telephone,
    String? email,
    String? nif,
    String? logoUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Agence(
      id: id ?? this.id,
      nom: nom ?? this.nom,
      adresse: adresse ?? this.adresse,
      telephone: telephone ?? this.telephone,
      email: email ?? this.email,
      nif: nif ?? this.nif,
      logoUrl: logoUrl ?? this.logoUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

