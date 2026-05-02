import prompts from 'prompts';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import {
  pathExists,
  writeFile,
  readFile,
  isDirectory,
} from '../utils/file-writer';
import {
  generateTemplateVariables,
  renderTemplate,
} from '../utils/template-renderer';
import { validateModuleName, normalizeModuleName } from '../utils/validators';
import { addModuleImport, findSchemaFile, addDatabaseSchemaExport, findDbSchemaIndexFile } from '../utils/ast-modifier';

/**
 * make:module command
 * Generates a full domain module with DDD Lite structure
 */

interface ModuleOptions {
  name?: string;
}

export async function makeModule(options: ModuleOptions = {}) {
  console.log(chalk.bold.blue('\n🚀 JetFrame Module Generator\n'));

  // Step 1: Get module name
  let moduleName = options.name;

  if (!moduleName) {
    const response = await prompts({
      type: 'text',
      name: 'moduleName',
      message: 'What is the module name? (e.g., projects, tasks, analytics)',
      validate: (value) => {
        const result = validateModuleName(value);
        return result.valid ? true : result.error || 'Invalid module name';
      },
    });

    if (!response.moduleName) {
      console.log(chalk.yellow('\n❌ Module generation cancelled\n'));
      process.exit(0);
    }

    moduleName = response.moduleName;
  }

  // Normalize to camelCase
  moduleName = normalizeModuleName(moduleName);

  // Validate
  const validation = validateModuleName(moduleName);
  if (!validation.valid) {
    console.log(chalk.red(`\n❌ ${validation.error}\n`));
    process.exit(1);
  }

  // Step 2: Check if module already exists
  const projectRoot = process.cwd();
  const modulePath = path.join(projectRoot, 'apps/web/modules', moduleName);

  if (await pathExists(modulePath)) {
    console.log(chalk.red(`\n❌ Module "${moduleName}" already exists at:`));
    console.log(chalk.gray(`   ${modulePath}\n`));
    process.exit(1);
  }

  // Step 3: Generate template variables
  const variables = generateTemplateVariables(moduleName);

  console.log(chalk.gray(`\nGenerating module: ${chalk.white.bold(moduleName)}`));
  console.log(chalk.gray(`Location: ${modulePath}\n`));

  const spinner = ora('Creating module files...').start();

  try {
    // Step 4: Load templates and generate files
    const templatesDir = path.join(__dirname, '../templates/module');

    const files = [
      {
        template: 'api.ts.template',
        output: path.join(modulePath, 'api.ts'),
      },
      {
        template: 'service.ts.template',
        output: path.join(modulePath, 'service.ts'),
      },
      {
        template: 'types.ts.template',
        output: path.join(modulePath, 'types.ts'),
      },
      {
        template: 'schema.ts.template',
        output: path.join(modulePath, 'schema.ts'),
      },
      {
        template: 'components/ExampleComponent.tsx.template',
        output: path.join(
          modulePath,
          'components',
          `${variables.ModuleName}Component.tsx`
        ),
      },
      {
        template: 'graphql/documents/queries.ts.template',
        output: path.join(modulePath, 'graphql/documents/queries.ts'),
      },
      {
        template: 'graphql/documents/mutations.ts.template',
        output: path.join(modulePath, 'graphql/documents/mutations.ts'),
      },
    ];

    // Generate each file
    for (const file of files) {
      const templatePath = path.join(templatesDir, file.template);
      const templateContent = await readFile(templatePath);
      const renderedContent = renderTemplate(templateContent, variables);
      await writeFile(file.output, renderedContent, { silent: true });
    }

    spinner.succeed('Module files created');

    // Step 5: Auto-register in GraphQL schema
    spinner.start('Registering module in GraphQL schema...');

    const schemaFile = findSchemaFile(projectRoot);
    await addModuleImport(schemaFile, moduleName);

    spinner.succeed('Module registered in GraphQL schema');

    // Step 5.5: Auto-register in DB schema exports
    spinner.start('Registering module in database schema...');

    const dbSchemaIndexFile = findDbSchemaIndexFile(projectRoot);
    await addDatabaseSchemaExport(dbSchemaIndexFile, moduleName);

    spinner.succeed('Module registered in database schema');

    // Step 6: Success message
    console.log(chalk.green.bold('\n✅ Module created successfully!\n'));

    console.log(chalk.white('Next steps:'));
    console.log(chalk.gray('  1. Push database schema changes:'));
    console.log(chalk.cyan(`     pnpm db:push\n`));

    console.log(chalk.gray('  2. Regenerate GraphQL types:'));
    console.log(chalk.cyan(`     pnpm graphql:generate\n`));

    console.log(chalk.gray('  3. Start building your module!'));
    console.log(chalk.cyan(`     Edit ${chalk.white(`apps/web/modules/${moduleName}/`)}\n`));
  } catch (error) {
    spinner.fail('Failed to create module');
    console.log(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`));
    process.exit(1);
  }
}
