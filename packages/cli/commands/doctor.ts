import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { pathExists } from '../utils/file-writer';
import { isValidNodeVersion } from '../utils/validators';

/**
 * doctor command
 * Runs diagnostic checks on the environment
 */

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

export async function doctor() {
  console.log(chalk.bold.blue('\n🏥 JetFrame Environment Check\n'));

  const results: CheckResult[] = [];

  // Check 1: Node.js version
  const nodeSpinner = ora('Checking Node.js version...').start();
  const nodeVersion = process.version;
  const minNodeVersion = '18.0.0';

  if (isValidNodeVersion(nodeVersion, minNodeVersion)) {
    nodeSpinner.succeed(
      `Node.js version: ${chalk.green(nodeVersion)} ${chalk.gray('(>= 18.0.0)')}`
    );
    results.push({
      name: 'Node.js',
      status: 'pass',
      message: `Version ${nodeVersion} is supported`,
    });
  } else {
    nodeSpinner.fail(
      `Node.js version: ${chalk.red(nodeVersion)} ${chalk.gray('(requires >= 18.0.0)')}`
    );
    results.push({
      name: 'Node.js',
      status: 'fail',
      message: `Version ${nodeVersion} is too old. Please upgrade to >= 18.0.0`,
    });
  }

  // Check 2: .env file
  const envSpinner = ora('Checking for .env file...').start();
  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, '.env');

  if (await pathExists(envPath)) {
    envSpinner.succeed(`.env file found at ${chalk.gray(envPath)}`);
    results.push({
      name: '.env file',
      status: 'pass',
      message: 'Environment file exists',
    });
  } else {
    envSpinner.fail(`.env file not found at ${chalk.gray(envPath)}`);
    results.push({
      name: '.env file',
      status: 'fail',
      message: 'Create a .env file in the project root',
    });
  }

  // Check 3: Database connection
  const dbSpinner = ora('Testing database connection...').start();

  try {
    // Dynamically import the database module
    const dbPath = path.join(projectRoot, 'packages/db/index.ts');

    if (!(await pathExists(dbPath))) {
      throw new Error('Database package not found');
    }

    // Import and test connection
    const { db } = await import(dbPath);

    // Execute a simple query
    await db.execute('SELECT 1 as result');

    dbSpinner.succeed('Database connection successful');
    results.push({
      name: 'Database',
      status: 'pass',
      message: 'Connection successful',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    dbSpinner.fail(`Database connection failed: ${chalk.red(errorMessage)}`);
    results.push({
      name: 'Database',
      status: 'fail',
      message: `Connection failed: ${errorMessage}`,
    });
  }

  // Check 4: Required packages
  const packagesSpinner = ora('Checking required packages...').start();
  const requiredPackages = [
    'apps/web/package.json',
    'packages/db/package.json',
    'packages/cli/package.json',
  ];

  let allPackagesExist = true;
  for (const pkg of requiredPackages) {
    const pkgPath = path.join(projectRoot, pkg);
    if (!(await pathExists(pkgPath))) {
      allPackagesExist = false;
      break;
    }
  }

  if (allPackagesExist) {
    packagesSpinner.succeed('All required packages found');
    results.push({
      name: 'Packages',
      status: 'pass',
      message: 'All required packages are installed',
    });
  } else {
    packagesSpinner.warn('Some packages may be missing');
    results.push({
      name: 'Packages',
      status: 'warn',
      message: 'Run pnpm install to ensure all packages are installed',
    });
  }

  // Summary
  console.log(chalk.bold('\n📊 Summary:\n'));

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warnings = results.filter((r) => r.status === 'warn').length;

  results.forEach((result) => {
    const icon =
      result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠';
    const color =
      result.status === 'pass'
        ? chalk.green
        : result.status === 'fail'
          ? chalk.red
          : chalk.yellow;

    console.log(
      `  ${color(icon)} ${chalk.white.bold(result.name)}: ${chalk.gray(result.message)}`
    );
  });

  console.log();

  if (failed > 0) {
    console.log(
      chalk.red.bold(
        `❌ ${failed} check${failed > 1 ? 's' : ''} failed. Please fix the issues above.\n`
      )
    );
    process.exit(1);
  } else if (warnings > 0) {
    console.log(
      chalk.yellow.bold(
        `⚠️  ${warnings} warning${warnings > 1 ? 's' : ''}. Everything should work, but consider addressing the warnings.\n`
      )
    );
  } else {
    console.log(chalk.green.bold('✅ All checks passed! Your environment is ready.\n'));
  }
}
