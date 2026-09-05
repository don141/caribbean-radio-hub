# Breeze — Flutter mobile app

The Breeze iOS/Android client for the Caribbean internet-radio hub.

- **App name:** Breeze
- **Android application ID:** `com.rnitechsolutions.breeze`
- **iOS bundle identifier:** `com.rnitechsolutions.breeze`
- **Flutter SDK:** stable channel, built/verified on **3.47.2** (Dart 3.13.2)
- **State management:** Riverpod (with `riverpod_generator` code generation)

## Architecture

```
lib/
├── core/        # cross-cutting app concerns (theme, config, DI wiring)
├── features/    # one folder per product feature (home, catalog, playback, …)
│   └── home/
│       ├── application/   # providers / controllers (Riverpod)
│       └── home_screen.dart
├── shared/      # reusable widgets/utils not owned by a single feature
└── main.dart    # entry point; wraps the app in a ProviderScope
```

Riverpod code generation is wired end to end. Providers annotated with
`@riverpod` (see `lib/features/home/application/tagline_provider.dart`) generate
their `*.g.dart` companion via `build_runner`. Generated files are committed so
CI only needs `flutter pub get` / `analyze` / `test`.

## Run from a clean checkout

Prerequisites: [Flutter SDK](https://docs.flutter.dev/get-started/install)
(stable, ≥ 3.47) with the Android and/or iOS toolchain installed. Verify with
`flutter doctor`.

```bash
git clone https://github.com/don141/caribbean-radio-hub.git
cd caribbean-radio-hub/apps/mobile

flutter pub get           # fetch packages
flutter analyze           # static analysis (expect: No issues found)
flutter test              # unit/widget tests (expect: All tests passed)

flutter run               # launch on a connected device / simulator / emulator
```

Regenerate Riverpod code after editing an `@riverpod` provider:

```bash
dart run build_runner build          # one-shot
dart run build_runner watch          # continuous
```

## Firebase (FlutterFire) — not yet wired

The app declares the Firebase packages (`firebase_core`, `firebase_auth`,
`cloud_firestore`, `firebase_analytics`, `firebase_crashlytics`) but does **not**
call `Firebase.initializeApp` yet, because the generated config does not exist in
the tree. **No Firebase credentials or project IDs are hardcoded.**

To connect the app to the production Firebase project, run the standard
FlutterFire workflow (requires founder-provided console access — see the founder
checklist in the repo root `README.md`):

```bash
dart pub global activate flutterfire_cli
flutterfire configure           # select the production project; registers
                                # com.rnitechsolutions.breeze for Android + iOS
```

This generates `lib/firebase_options.dart`, `android/app/google-services.json`,
and `ios/Runner/GoogleService-Info.plist`. The two native config files are
**gitignored** (they may carry keys) — never commit them. Then initialize
Firebase in `main.dart`:

```dart
WidgetsFlutterBinding.ensureInitialized();
await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
```

## Authentication posture

Browsing and listening must work **without an account**. Firebase Auth is only
required for personalized/account features (favorites sync, profile, settings).
Keep the public catalog readable anonymously; gate only user-owned Firestore
data behind auth (coordinated with the Firestore rules in BRE-38).
