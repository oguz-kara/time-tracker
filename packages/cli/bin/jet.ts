#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { makeModule } from '../commands/make-module';
import { doctor } from '../commands/doctor';

/**
 * JetFrame CLI - The Jet Command-Line Interface
 * Laravel Artisan / Rails-style generators for JetFrame
 */

const program = new Command();

// Get version from package.json
const getVersion = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('../package.json');
    return pkg.version;
  } catch {
    return '0.1.0';
  }
};

// Configure program
program
  .name('jet')
  .description('JetFrame CLI - Domain-Driven SaaS Development Tool')
  .version(getVersion())
  .addHelpText(
    'after',
    `
${chalk.bold('Examples:')}
  ${chalk.cyan('pnpm jet make:module projects')}    Create a new domain module
  ${chalk.cyan('pnpm jet doctor')}                  Check environment health

${chalk.bold('Documentation:')}
  Read ${chalk.white('docs/specs/17_cli_framework.md')} for complete CLI documentation
  Read ${chalk.white('CLAUDE.md')} for architecture guidelines
`
  );

// make:module command
program
  .command('make:module [name]')
  .description('Generate a new domain module with DDD Lite structure')
  .action(async (name?: string) => {
    try {
      await makeModule({ name });
    } catch (error) {
      console.error(
        chalk.red('\n❌ Error:'),
        error instanceof Error ? error.message : 'Unknown error'
      );
      process.exit(1);
    }
  });

// doctor command
program
  .command('doctor')
  .description('Run diagnostic checks on the development environment')
  .action(async () => {
    try {
      await doctor();
    } catch (error) {
      console.error(
        chalk.red('\n❌ Error:'),
        error instanceof Error ? error.message : 'Unknown error'
      );
      process.exit(1);
    }
  });

// Global error handler
process.on('unhandledRejection', (error) => {
  console.error(
    chalk.red('\n❌ Unhandled error:'),
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});

// Parse arguments
program.parse();
