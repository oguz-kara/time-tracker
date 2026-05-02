/**
 * Input validation utilities
 */

/**
 * Validate module name
 * - Must be alphanumeric
 * - Can contain underscores
 * - Should be in camelCase or PascalCase
 * - No spaces or special characters
 */
export function validateModuleName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Module name cannot be empty' };
  }

  if (name.length < 2) {
    return { valid: false, error: 'Module name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Module name must be less than 50 characters' };
  }

  // Check for valid characters (alphanumeric + underscore)
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    return {
      valid: false,
      error:
        'Module name must start with a letter and contain only letters, numbers, and underscores',
    };
  }

  // Reserved keywords
  const reserved = [
    'module',
    'import',
    'export',
    'class',
    'interface',
    'type',
    'function',
    'const',
    'let',
    'var',
    'shared',
    'config',
    'lib',
    'utils',
  ];

  if (reserved.includes(name.toLowerCase())) {
    return {
      valid: false,
      error: `"${name}" is a reserved keyword and cannot be used as a module name`,
    };
  }

  return { valid: true };
}

/**
 * Normalize module name to camelCase
 */
export function normalizeModuleName(name: string): string {
  // Remove spaces and special characters
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, '');

  // Convert to camelCase if it's PascalCase
  if (cleaned.length > 0) {
    return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Check if a string is valid Node.js version
 */
export function isValidNodeVersion(version: string, minimum: string): boolean {
  const parseVersion = (v: string): number[] => {
    return v
      .replace(/^v/, '')
      .split('.')
      .map((n) => parseInt(n, 10));
  };

  const current = parseVersion(version);
  const min = parseVersion(minimum);

  for (let i = 0; i < Math.max(current.length, min.length); i++) {
    const c = current[i] || 0;
    const m = min[i] || 0;

    if (c > m) return true;
    if (c < m) return false;
  }

  return true;
}
