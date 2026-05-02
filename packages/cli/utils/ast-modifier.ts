import * as ts from 'typescript';
import { readFile, writeFile } from './file-writer';

/**
 * TypeScript AST manipulation utility
 * Auto-registers modules in the GraphQL schema
 */

/**
 * Add an import statement to the GraphQL schema file
 * This prevents the #1 bug: forgetting to import new modules
 */
export async function addModuleImport(
  schemaFilePath: string,
  moduleName: string
): Promise<void> {
  // Read the current schema file
  const sourceCode = await readFile(schemaFilePath);

  // Create a source file
  const sourceFile = ts.createSourceFile(
    schemaFilePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  // The import we want to add
  const newImport = `import '@/modules/${moduleName}/api';`;

  // Check if import already exists
  if (sourceCode.includes(newImport)) {
    console.log(`  ℹ Import for ${moduleName} already exists in schema.ts`);
    return;
  }

  // Find the position to insert the import
  // We want to insert after the last import statement but before the schema export
  let insertPosition = 0;
  let lastImportEnd = 0;

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      lastImportEnd = node.end;
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  // If we found imports, insert after the last one
  if (lastImportEnd > 0) {
    insertPosition = lastImportEnd;
  }

  // Split the source code and insert the new import
  const before = sourceCode.substring(0, insertPosition);
  const after = sourceCode.substring(insertPosition);

  // Add newline before the import if needed
  const newlinePrefix = before.endsWith('\n') ? '' : '\n';
  const newContent = `${before}${newlinePrefix}${newImport}\n${after}`;

  // Write the modified content
  await writeFile(schemaFilePath, newContent, { overwrite: true, silent: true });

  console.log(`  ✓ Added import to schema.ts: ${newImport}`);
}

/**
 * Find the GraphQL schema file in the project
 */
export function findSchemaFile(projectRoot: string): string {
  // Standard location in JetFrame
  return `${projectRoot}/apps/web/lib/graphql/schema.ts`;
}

/**
 * Add a database schema export to packages/db/schema/index.ts
 * This ensures Drizzle sees the new module's tables
 */
export async function addDatabaseSchemaExport(
  dbSchemaIndexPath: string,
  moduleName: string
): Promise<void> {
  // Read the current schema index file
  const sourceCode = await readFile(dbSchemaIndexPath);

  // The export we want to add
  const newExport = `export * from '../../apps/web/modules/${moduleName}/schema';`;

  // Check if export already exists
  if (sourceCode.includes(newExport)) {
    console.log(`  ℹ Schema export for ${moduleName} already exists in packages/db/schema/index.ts`);
    return;
  }

  // Add the new export at the end of the file
  const newContent = `${sourceCode.trimEnd()}\nexport * from '../../apps/web/modules/${moduleName}/schema';\n`;

  // Write the modified content
  await writeFile(dbSchemaIndexPath, newContent, { overwrite: true, silent: true });

  console.log(`  ✓ Added schema export: ${newExport}`);
}

/**
 * Find the database schema index file
 */
export function findDbSchemaIndexFile(projectRoot: string): string {
  return `${projectRoot}/packages/db/schema/index.ts`;
}
