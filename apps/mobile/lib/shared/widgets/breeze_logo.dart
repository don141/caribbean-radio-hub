import 'package:flutter/material.dart';

/// Small reusable brand mark used across screens. Lives in `shared/` because it
/// is not owned by any single feature.
class BreezeLogo extends StatelessWidget {
  const BreezeLogo({super.key, this.size = 64});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Icon(Icons.radio, size: size, color: Theme.of(context).colorScheme.primary);
  }
}
