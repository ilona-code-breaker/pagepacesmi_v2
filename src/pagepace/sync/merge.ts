// Pure merge rules for moving device data into an account (first sign-in on a device).
const identity = (item: unknown): string => {
  if (item && typeof item === 'object' && 'id' in item) return 'id:' + String((item as { id: unknown }).id);
  return 'json:' + JSON.stringify(item);
};

/** Lists are combined (no duplicates by id); for anything else the account copy wins. */
export function mergeValue(local: unknown, remote: unknown): unknown {
  if (remote === undefined) return local;
  if (local === undefined) return remote;
  if (Array.isArray(local) && Array.isArray(remote)) {
    const seen = new Set(remote.map(identity));
    return [...remote, ...local.filter((i) => !seen.has(identity(i)))];
  }
  return remote;
}
