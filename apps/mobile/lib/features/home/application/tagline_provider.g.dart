// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tagline_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Trivial code-generated provider that exists only to prove the Riverpod
/// codegen pipeline (`riverpod_annotation` + `riverpod_generator` +
/// `build_runner`) is wired end to end in the scaffold. Real providers for the
/// station catalog, playback, and favourites arrive in later feature tickets.

@ProviderFor(tagline)
final taglineProvider = TaglineProvider._();

/// Trivial code-generated provider that exists only to prove the Riverpod
/// codegen pipeline (`riverpod_annotation` + `riverpod_generator` +
/// `build_runner`) is wired end to end in the scaffold. Real providers for the
/// station catalog, playback, and favourites arrive in later feature tickets.

final class TaglineProvider extends $FunctionalProvider<String, String, String>
    with $Provider<String> {
  /// Trivial code-generated provider that exists only to prove the Riverpod
  /// codegen pipeline (`riverpod_annotation` + `riverpod_generator` +
  /// `build_runner`) is wired end to end in the scaffold. Real providers for the
  /// station catalog, playback, and favourites arrive in later feature tickets.
  TaglineProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'taglineProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$taglineHash();

  @$internal
  @override
  $ProviderElement<String> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  String create(Ref ref) {
    return tagline(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(String value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<String>(value),
    );
  }
}

String _$taglineHash() => r'8c3fb2db4aabc2701358ebdb3dd01e172f2750d7';
