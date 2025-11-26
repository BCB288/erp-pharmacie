class AppConstants {
  // App Info
  static const String appName = 'TiganaDrive Manager';
  static const String appVersion = '1.0.0';
  
  // Supabase Configuration
  static const String supabaseUrl = 'https://bugiwldaipnqqrfdasdk.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1Z2l3bGRhaXBucXFyZmRhc2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDYxNjQsImV4cCI6MjA3OTA4MjE2NH0.WOY2_UqAWgRDzPjVu8mbZo-yU0BUxYyBhucDl0xtB2o';
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // Date Formats
  static const String dateFormat = 'dd/MM/yyyy';
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm';
  static const String timeFormat = 'HH:mm';
  
  // Statuts Élèves
  static const List<String> statutsEleves = [
    'inscrit',
    'en_formation',
    'permis_obtenu',
    'abandon',
  ];
  
  // Statuts Contrats
  static const List<String> statutsContrats = [
    'actif',
    'termine',
    'suspendu',
    'annule',
  ];
  
  // Types de Formation
  static const List<String> typesFormation = [
    'classique',
    'acceleree',
    'conduite_accompagnee',
  ];
  
  // Catégories de Permis
  static const List<String> categoriesPermis = [
    'A',
    'A1',
    'A2',
    'B',
    'BE',
    'C',
    'D',
  ];
  
  // Modes de Paiement
  static const List<String> modesPaiement = [
    'especes',
    'cheque',
    'virement',
    'carte_bancaire',
    'mobile_money',
  ];
  
  // Types d'Examens
  static const List<String> typesExamen = [
    'code',
    'conduite',
  ];
  
  // Résultats Examens
  static const List<String> resultatsExamen = [
    'reussi',
    'echec',
    'absent',
  ];
  
  // Statuts Leçons
  static const List<String> statutsLecons = [
    'planifie',
    'effectue',
    'annule',
    'reporte',
  ];
}

