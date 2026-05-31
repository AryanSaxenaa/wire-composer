/** True when a required action input is absent (0 and false are valid values). */
export function isUnsetInput(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}
