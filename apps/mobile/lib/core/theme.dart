import 'package:flutter/material.dart';

/// App-wide theme for Breeze.
///
/// Deliberately minimal for the scaffold — product visual design lands in a
/// later ticket. The seed colour is a placeholder "Caribbean teal".
final ThemeData breezeTheme = ThemeData(
  colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF00A5A5)),
  useMaterial3: true,
);
