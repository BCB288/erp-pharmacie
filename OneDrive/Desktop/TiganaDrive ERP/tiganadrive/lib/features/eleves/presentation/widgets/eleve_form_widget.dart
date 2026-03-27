import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../data/models/eleve.dart';
import '../../../../data/repositories/eleve_repository.dart';

/// Widget de formulaire réutilisable pour créer ou modifier un élève
class EleveFormWidget extends ConsumerStatefulWidget {
  final Eleve? eleve; // null = création, non-null = modification
  final String agenceId;
  final VoidCallback? onSuccess;

  const EleveFormWidget({
    super.key,
    this.eleve,
    required this.agenceId,
    this.onSuccess,
  });

  @override
  ConsumerState<EleveFormWidget> createState() => _EleveFormWidgetState();
}

class _EleveFormWidgetState extends ConsumerState<EleveFormWidget> {
  final _formKey = GlobalKey<FormState>();
  final _nomController = TextEditingController();
  final _prenomController = TextEditingController();
  final _telephoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _adresseController = TextEditingController();
  final _villeController = TextEditingController();
  final _codePostalController = TextEditingController();
  final _contactUrgenceNomController = TextEditingController();
  final _contactUrgenceTelephoneController = TextEditingController();
  final _contactUrgenceRelationController = TextEditingController();

  DateTime? _dateNaissance;
  String _statut = 'inscrit';
  String? _sexe;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.eleve != null) {
      _loadEleveData();
    }
  }

  void _loadEleveData() {
    final eleve = widget.eleve!;
    _nomController.text = eleve.nom;
    _prenomController.text = eleve.prenom;
    _telephoneController.text = eleve.telephone ?? '';
    _emailController.text = eleve.email ?? '';
    _adresseController.text = eleve.adresse ?? '';
    _villeController.text = eleve.ville ?? '';
    _codePostalController.text = eleve.codePostal ?? '';
    _contactUrgenceNomController.text = eleve.contactUrgenceNom ?? '';
    _contactUrgenceTelephoneController.text = eleve.contactUrgenceTelephone ?? '';
    _contactUrgenceRelationController.text = eleve.contactUrgenceRelation ?? '';
    _dateNaissance = eleve.dateNaissance;
    _statut = eleve.statut;
    _sexe = eleve.sexe;
  }

  @override
  void dispose() {
    _nomController.dispose();
    _prenomController.dispose();
    _telephoneController.dispose();
    _emailController.dispose();
    _adresseController.dispose();
    _villeController.dispose();
    _codePostalController.dispose();
    _contactUrgenceNomController.dispose();
    _contactUrgenceTelephoneController.dispose();
    _contactUrgenceRelationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section Informations Personnelles
            Text(
              'Informations Personnelles',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _nomController,
                    decoration: const InputDecoration(
                      labelText: 'Nom *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(LucideIcons.user),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Le nom est requis';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _prenomController,
                    decoration: const InputDecoration(
                      labelText: 'Prénom *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(LucideIcons.user),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Le prénom est requis';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: _dateNaissance ?? DateTime(2000),
                        firstDate: DateTime(1950),
                        lastDate: DateTime.now(),
                      );
                      if (date != null) {
                        setState(() => _dateNaissance = date);
                      }
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date de naissance',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(LucideIcons.calendar),
                      ),
                      child: Text(
                        _dateNaissance != null
                            ? '${_dateNaissance!.day}/${_dateNaissance!.month}/${_dateNaissance!.year}'
                            : 'Sélectionner une date',
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _sexe,
                    decoration: const InputDecoration(
                      labelText: 'Sexe',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Non spécifié')),
                      DropdownMenuItem(value: 'M', child: Text('Masculin')),
                      DropdownMenuItem(value: 'F', child: Text('Féminin')),
                    ],
                    onChanged: (value) {
                      setState(() => _sexe = value);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Section Contact
            Text(
              'Coordonnées',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _telephoneController,
                    decoration: const InputDecoration(
                      labelText: 'Téléphone',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(LucideIcons.phone),
                    ),
                    keyboardType: TextInputType.phone,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _emailController,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(LucideIcons.mail),
                    ),
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) {
                      if (value != null &&
                          value.isNotEmpty &&
                          !value.contains('@')) {
                        return 'Email invalide';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _adresseController,
              decoration: const InputDecoration(
                labelText: 'Adresse',
                border: OutlineInputBorder(),
                prefixIcon: Icon(LucideIcons.mapPin),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _villeController,
                    decoration: const InputDecoration(
                      labelText: 'Ville',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.location_city),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _codePostalController,
                    decoration: const InputDecoration(
                      labelText: 'Code postal',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(LucideIcons.mapPin),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Section Contact d'urgence
            Text(
              'Contact d\'urgence',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contactUrgenceNomController,
              decoration: const InputDecoration(
                labelText: 'Nom du contact',
                border: OutlineInputBorder(),
                prefixIcon: Icon(LucideIcons.userPlus),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _contactUrgenceTelephoneController,
                    decoration: const InputDecoration(
                      labelText: 'Téléphone',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(LucideIcons.phone),
                    ),
                    keyboardType: TextInputType.phone,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _contactUrgenceRelationController,
                    decoration: const InputDecoration(
                      labelText: 'Relation (Père, Mère, etc.)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.family_restroom),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Section Statut
            Text(
              'Statut',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _statut,
              decoration: const InputDecoration(
                labelText: 'Statut de l\'élève',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.flag),
              ),
              items: AppConstants.statutsEleves.map((statut) {
                return DropdownMenuItem(
                  value: statut,
                  child: Text(_getStatutLabel(statut)),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _statut = value);
                }
              },
            ),
            const SizedBox(height: 32),

            // Boutons d'action
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton(
                  onPressed: _isLoading
                      ? null
                      : () {
                          Navigator.of(context).pop();
                        },
                  child: const Text('Annuler'),
                ),
                const SizedBox(width: 16),
                ElevatedButton.icon(
                  onPressed: _isLoading ? null : _saveEleve,
                  icon: _isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(LucideIcons.save),
                  label: Text(
                    widget.eleve == null ? 'Créer' : 'Enregistrer',
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 16,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getStatutLabel(String statut) {
    switch (statut) {
      case 'inscrit':
        return 'Inscrit';
      case 'en_formation':
        return 'En formation';
      case 'permis_obtenu':
        return 'Permis obtenu';
      case 'abandon':
        return 'Abandon';
      default:
        return statut;
    }
  }

  Future<void> _saveEleve() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final eleveRepo = ref.read(eleveRepositoryProvider);

      final eleve = Eleve(
        id: widget.eleve?.id ?? '',
        agenceId: widget.agenceId,
        nom: _nomController.text.trim(),
        prenom: _prenomController.text.trim(),
        dateNaissance: _dateNaissance,
        telephone: _telephoneController.text.trim().isEmpty
            ? null
            : _telephoneController.text.trim(),
        email: _emailController.text.trim().isEmpty
            ? null
            : _emailController.text.trim(),
        adresse: _adresseController.text.trim().isEmpty
            ? null
            : _adresseController.text.trim(),
        ville: _villeController.text.trim().isEmpty
            ? null
            : _villeController.text.trim(),
        codePostal: _codePostalController.text.trim().isEmpty
            ? null
            : _codePostalController.text.trim(),
        contactUrgenceNom: _contactUrgenceNomController.text.trim().isEmpty
            ? null
            : _contactUrgenceNomController.text.trim(),
        contactUrgenceTelephone:
            _contactUrgenceTelephoneController.text.trim().isEmpty
                ? null
                : _contactUrgenceTelephoneController.text.trim(),
        contactUrgenceRelation:
            _contactUrgenceRelationController.text.trim().isEmpty
                ? null
                : _contactUrgenceRelationController.text.trim(),
        sexe: _sexe,
        statut: _statut,
        createdAt: widget.eleve?.createdAt,
        updatedAt: DateTime.now(),
      );

      if (widget.eleve == null) {
        // Création
        await eleveRepo.create(eleve);
      } else {
        // Modification
        await eleveRepo.update(widget.eleve!.id, eleve);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.eleve == null
                  ? 'Élève créé avec succès'
                  : 'Élève modifié avec succès',
            ),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop();
        widget.onSuccess?.call();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}

final eleveRepositoryProvider = Provider((ref) => EleveRepository());

