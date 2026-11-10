// Used by the single-file demo build, where service workers aren't available.
export function registerSW(_opts?: unknown) {
  return async () => {}
}
