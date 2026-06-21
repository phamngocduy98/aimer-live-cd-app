export const DEFAULT_E2E_DB_NAME = "musicbtxa_e2e";

export function isSafeTestDbName(dbName: string): boolean {
  return /(?:_e2e|_test)$/i.test(dbName);
}

export function assertSafeTestDbName(dbName: string): void {
  if (!isSafeTestDbName(dbName)) {
    throw new Error(
      `Refusing to use unsafe E2E database "${dbName}". Use a name ending with _e2e or _test.`
    );
  }
}

export function resolveE2eDbName(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.E2E_DB_NAME;
  if (configured && isSafeTestDbName(configured)) return configured;

  return DEFAULT_E2E_DB_NAME;
}
