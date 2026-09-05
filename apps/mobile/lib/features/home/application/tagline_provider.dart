import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'tagline_provider.g.dart';

/// Trivial code-generated provider that exists only to prove the Riverpod
/// codegen pipeline (`riverpod_annotation` + `riverpod_generator` +
/// `build_runner`) is wired end to end in the scaffold. Real providers for the
/// station catalog, playback, and favourites arrive in later feature tickets.
@riverpod
String tagline(Ref ref) => 'Caribbean radio, one tap away';
