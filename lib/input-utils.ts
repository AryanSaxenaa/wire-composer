/** True when a required action input is absent (0 and false are valid values). */
export function isUnsetInput(value: unknown): boolean {
  return value == null || value === "";
}
