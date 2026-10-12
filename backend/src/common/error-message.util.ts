/** Safe `.message` for a caught/rejected value of unknown type. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
