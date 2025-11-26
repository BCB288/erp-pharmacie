import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/constants/app_constants.dart';

class SupabaseService {
  static SupabaseClient? _instance;

  static SupabaseClient get instance {
    if (_instance == null) {
      throw Exception(
        'Supabase n\'a pas été initialisé. Appelez SupabaseService.initialize() d\'abord.',
      );
    }
    return _instance!;
  }

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      anonKey: AppConstants.supabaseAnonKey,
    );
    _instance = Supabase.instance.client;
  }

  static User? get currentUser => _instance?.auth.currentUser;
  
  static String? get currentUserId => currentUser?.id;
  
  static bool get isAuthenticated => currentUser != null;
}

