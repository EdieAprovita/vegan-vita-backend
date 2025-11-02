/**
 * Shared validation utilities
 * These functions are used across the application to maintain consistency
 */

/**
 * Validates that a port number is valid
 * @param portValue - The port value to validate (string or number)
 * @param fieldName - The name of the field for error messages
 * @returns The validated port number
 * @throws Error if the port is invalid
 */
export function validatePort(
  portValue: string | number,
  fieldName = 'PORT',
): number {
  const port =
    typeof portValue === 'string' ? parseInt(portValue, 10) : portValue;

  if (isNaN(port)) {
    throw new Error(`Invalid ${fieldName}: must be a numeric value`);
  }

  if (port < 1 || port > 65535) {
    throw new Error(`Invalid ${fieldName}: must be between 1 and 65535`);
  }

  return port;
}
