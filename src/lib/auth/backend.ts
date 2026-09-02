// Single place that chooses the concrete auth backend, so the rest of the app
// depends only on the {@link AuthBackend} interface.
//
// TODO(Linus, BRE-40 Firebase): when the Firebase adapter lands, select it when
// configured and fall back to local for local dev, e.g.:
//   return process.env.NEXT_PUBLIC_FIREBASE_API_KEY
//     ? new FirebaseAuthBackend()
//     : new LocalAuthBackend();

import { LocalAuthBackend } from "./localBackend";
import type { AuthBackend } from "./types";

export function createAuthBackend(): AuthBackend {
  return new LocalAuthBackend();
}
