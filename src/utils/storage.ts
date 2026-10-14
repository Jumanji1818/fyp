// App storage: SQLite (via the Electron shell) on desktop, browser localStorage everywhere else.
// The desktop cache is loaded synchronously once at start-up, so the rest of the app stays synchronous.
type DesktopDb = {
  loadAll: () => Record<string, string>;
  set: (k: string, v: string) => void;
  remove: (k: string) => void;
  clear: () => void;
};

const desktop: DesktopDb | undefined = (window as any).procuraDesktop?.db;
const PREFIX = 'procura_app_v1_';
let cache: Record<string, string> = {};

if (desktop) {
  try {
    cache = desktop.loadAll() || {};
    // One-time import of data saved by earlier versions in the browser profile
    if (Object.keys(cache).length === 0) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = k ? localStorage.getItem(k) : null;
        if (k && v !== null && k.startsWith(PREFIX)) {
          cache[k] = v;
          desktop.set(k, v);
        }
      }
    }
  } catch (e) {
    console.error('Database unavailable, using browser storage', e);
  }
}

const useDb = !!desktop;

export const appStorage = {
  getItem(key: string): string | null {
    if (!useDb) return localStorage.getItem(key);
    return key in cache ? cache[key] : null;
  },
  setItem(key: string, value: string): void {
    if (!useDb) return localStorage.setItem(key, value);
    if (cache[key] === value) return;
    cache[key] = value;
    desktop!.set(key, value);
  },
  removeItem(key: string): void {
    if (!useDb) return localStorage.removeItem(key);
    delete cache[key];
    desktop!.remove(key);
  },
  clear(): void {
    if (!useDb) return localStorage.clear();
    cache = {};
    desktop!.clear();
    localStorage.clear();
  },
};
