import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/theme.dart';
import 'features/home/home_screen.dart';

// Entry point. Firebase is intentionally NOT initialized here yet: the
// production Firebase project is still being configured and no
// `firebase_options.dart` (from `flutterfire configure`) exists in the tree.
// Once the founder provides the FlutterFire config, wire `Firebase.initializeApp`
// here inside `WidgetsFlutterBinding.ensureInitialized()`. See README §Firebase.
void main() {
  runApp(const ProviderScope(child: BreezeApp()));
}

class BreezeApp extends StatelessWidget {
  const BreezeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Breeze',
      debugShowCheckedModeBanner: false,
      theme: breezeTheme,
      home: const HomeScreen(),
    );
  }
}
