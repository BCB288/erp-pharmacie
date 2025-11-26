import 'package:intl/intl.dart';

/// Extensions pour les dates
extension DateTimeExtensions on DateTime {
  String toFormattedDate() {
    return DateFormat('dd/MM/yyyy').format(this);
  }
  
  String toFormattedDateTime() {
    return DateFormat('dd/MM/yyyy HH:mm').format(this);
  }
  
  String toFormattedTime() {
    return DateFormat('HH:mm').format(this);
  }
  
  bool isSameDay(DateTime other) {
    return year == other.year && month == other.month && day == other.day;
  }
}

/// Extensions pour les chaînes de caractères
extension StringExtensions on String {
  String capitalize() {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }
  
  String toTitleCase() {
    return split(' ').map((word) => word.capitalize()).join(' ');
  }
  
  DateTime? toDateTime() {
    try {
      return DateTime.parse(this);
    } catch (e) {
      return null;
    }
  }
}

/// Extensions pour les nombres
extension DoubleExtensions on double {
  String toCurrency({String symbol = 'FCFA'}) {
    final formatter = NumberFormat('#,##0', 'fr_FR');
    return '${formatter.format(this)} $symbol';
  }
}

extension IntExtensions on int {
  String toCurrency({String symbol = 'FCFA'}) {
    final formatter = NumberFormat('#,##0', 'fr_FR');
    return '${formatter.format(this)} $symbol';
  }
}

