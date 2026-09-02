export { AuthProvider, useAuth, type AuthState } from "./AuthProvider";
export { resolveGate, isAuthRequired, type GateDecision } from "./gate";
export {
  AuthError,
  messageForAuthError,
  type AuthUser,
  type AuthBackend,
  type AuthErrorCode,
} from "./types";
export { DEMO_CREDENTIALS } from "./localBackend";
