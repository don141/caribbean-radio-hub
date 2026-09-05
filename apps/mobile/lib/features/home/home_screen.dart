import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/widgets/breeze_logo.dart';
import 'application/tagline_provider.dart';

/// Minimal landing screen for the scaffold. Proves Riverpod is wired via
/// [taglineProvider]; the real browse/discovery UI lands in later tickets.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tagline = ref.watch(taglineProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Breeze')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const BreezeLogo(),
            const SizedBox(height: 16),
            Text(tagline, style: Theme.of(context).textTheme.titleMedium),
          ],
        ),
      ),
    );
  }
}
