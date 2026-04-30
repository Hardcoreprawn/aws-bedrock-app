const SENSITIVE_PATTERNS = [/password/gi, /secret/gi, /api\s*key/gi, /national\s+insurance/gi];

/**
 * Rejects document batches that match sensitive keyword patterns.
 */
export function assertSafeInput(documents: string[]) {
  const matchedPattern = SENSITIVE_PATTERNS.find((pattern) => documents.some((document) => pattern.test(document)));

  if (matchedPattern) {
    throw new Error(`Input failed safety screening for pattern: ${matchedPattern}`);
  }
}
