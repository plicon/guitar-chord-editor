/**
 * ID generation utilities
 */

/**
 * Generate a random ID using crypto.randomUUID()
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a short ID (8 characters) for URLs
 */
export function generateShortId(): string {
  const uuid = crypto.randomUUID();
  return uuid.split('-')[0];
}
