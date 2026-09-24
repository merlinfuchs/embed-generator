/**
 * Patches an optional nested object, dropping it once every field is empty.
 * Embeds treat an author or footer without any content as absent.
 */
export function patchGroup<T extends Record<string, unknown>>(
  group: T | undefined,
  patch: Partial<T>,
): T | undefined {
  const next = { ...group, ...patch } as T;
  return Object.values(next).some((value) => !!value) ? next : undefined;
}
