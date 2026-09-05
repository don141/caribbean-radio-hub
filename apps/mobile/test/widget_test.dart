import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:breeze/main.dart';

void main() {
  testWidgets('Breeze app boots and shows the tagline', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: BreezeApp()));

    expect(find.text('Breeze'), findsOneWidget);
    expect(find.text('Caribbean radio, one tap away'), findsOneWidget);
  });
}
