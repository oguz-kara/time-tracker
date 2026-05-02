/**
 * Template rendering utility
 * Replaces placeholder variables in template strings
 */

export interface TemplateVariables {
  moduleName: string; // camelCase: project
  ModuleName: string; // PascalCase: Project
  MODULE_NAME: string; // SCREAMING_SNAKE_CASE: PROJECT
  'module-name': string; // kebab-case: project
}

/**
 * Generate all case variations from a module name
 */
export function generateTemplateVariables(moduleName: string): TemplateVariables {
  // Ensure moduleName is in camelCase
  const camelCase = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);

  // PascalCase
  const pascalCase = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

  // SCREAMING_SNAKE_CASE - handle camelCase to snake_case conversion
  const snakeCase = camelCase
    .replace(/([A-Z])/g, '_$1')
    .toUpperCase()
    .replace(/^_/, '');

  // kebab-case
  const kebabCase = camelCase
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

  return {
    moduleName: camelCase,
    ModuleName: pascalCase,
    MODULE_NAME: snakeCase,
    'module-name': kebabCase,
  };
}

/**
 * Render a template string with variables
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let rendered = template;

  // Replace all occurrences of each variable
  // Use word boundaries to avoid partial matches
  Object.entries(variables).forEach(([key, value]) => {
    // Escape special regex characters in the key
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`{{${escapedKey}}}`, 'g');
    rendered = rendered.replace(regex, value);
  });

  return rendered;
}

/**
 * Render a template file name (for files that need dynamic names)
 */
export function renderFileName(
  fileName: string,
  variables: TemplateVariables
): string {
  // Remove .template extension
  let rendered = fileName.replace(/\.template$/, '');

  // Replace variables in filename
  Object.entries(variables).forEach(([key, value]) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`{{${escapedKey}}}`, 'g');
    rendered = rendered.replace(regex, value);
  });

  return rendered;
}
