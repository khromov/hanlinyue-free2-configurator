/** localStorage helpers that never throw (private mode, blocked storage, quota). */

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Per-model settings live under their own key, e.g. `hly:Free2:custom`. */
export const deviceKey = (deviceId: string, name: string) => `hly:${deviceId}:${name}`;
