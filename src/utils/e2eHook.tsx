import { useApp } from '../context/AppContext';
// Test-only: exposes the app context to automated tests. Rendered only in builds made with VITE_E2E=1.
export const E2EHook = () => {
  (window as any).__app = useApp();
  return null;
};
