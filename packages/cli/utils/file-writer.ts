import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Safe file operations utility
 * Wraps fs-extra with error handling and user feedback
 */

export interface FileWriteOptions {
  overwrite?: boolean;
  silent?: boolean;
}

/**
 * Ensure a directory exists, create it if it doesn't
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Write content to a file safely
 * @param filePath - Absolute path to the file
 * @param content - Content to write
 * @param options - Write options
 */
export async function writeFile(
  filePath: string,
  content: string,
  options: FileWriteOptions = {}
): Promise<void> {
  const { overwrite = false, silent = false } = options;

  // Check if file exists
  const exists = await fs.pathExists(filePath);

  if (exists && !overwrite) {
    throw new Error(`File already exists: ${filePath}`);
  }

  // Ensure directory exists
  const dir = path.dirname(filePath);
  await ensureDirectory(dir);

  // Write file
  await fs.writeFile(filePath, content, 'utf-8');

  if (!silent) {
    const action = exists ? 'Updated' : 'Created';
    console.log(chalk.green(`  ✓ ${action}: ${filePath}`));
  }
}

/**
 * Read a file's content
 */
export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Check if a file or directory exists
 */
export async function pathExists(targetPath: string): Promise<boolean> {
  return fs.pathExists(targetPath);
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(targetPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Copy a file from source to destination
 */
export async function copyFile(
  src: string,
  dest: string,
  options: FileWriteOptions = {}
): Promise<void> {
  const { overwrite = false, silent = false } = options;

  const exists = await fs.pathExists(dest);
  if (exists && !overwrite) {
    throw new Error(`File already exists: ${dest}`);
  }

  await fs.copy(src, dest, { overwrite });

  if (!silent) {
    console.log(chalk.green(`  ✓ Copied: ${dest}`));
  }
}
