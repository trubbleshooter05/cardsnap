import * as fs from 'fs';
import * as path from 'path';
import { ValidationError, ConflictReport, ChangeLog } from './types';

/**
 * Read and parse a JSON file safely.
 * Returns parsed JSON or throws descriptive error.
 */
export function readJsonFile(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err: any) {
    throw new Error(`Failed to read JSON from ${filePath}: ${err.message}`);
  }
}

/**
 * Write JSON to a file with pretty formatting.
 */
export function writeJsonFile(filePath: string, data: any, pretty = true): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data));
}

/**
 * Read existing data file (handles both JSON and TypeScript exports).
 * For TypeScript files, extracts the exported constant.
 */
export function readExistingData(filePath: string): Record<string, any> {
  try {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      // Read TypeScript file and extract export
      const content = fs.readFileSync(filePath, 'utf-8');

      // Match: export const NAME = { ... }
      const match = content.match(/export\s+const\s+(\w+)\s*=\s*(\{[\s\S]*?\n\}\s*(?:as\s+const)?);?/);
      if (match) {
        // For now, we'll read the actual JS-compiled version or require it
        // This is a simplified approach: look for the last exported object
        try {
          const evalStr = content
            .replace(/export\s+/g, '')
            .replace(/as\s+const;?$/gm, ';');
          // eslint-disable-next-line no-eval
          const result = eval(`(${evalStr})`);
          return result || {};
        } catch {
          return {};
        }
      }
      return {};
    } else {
      return readJsonFile(filePath);
    }
  } catch (err) {
    console.warn(`Could not read existing data from ${filePath}, treating as empty`);
    return {};
  }
}

/**
 * Validate that required fields exist in an entry.
 */
export function validateRequiredFields(
  entry: any,
  requiredFields: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of requiredFields) {
    if (entry[field] === undefined || entry[field] === null) {
      errors.push({
        field,
        message: `Required field missing: ${field}`,
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * Check if a value matches expected type.
 */
export function validateFieldType(
  entry: any,
  field: string,
  expectedType: string
): ValidationError | null {
  const value = entry[field];
  const actualType = Array.isArray(value) ? 'array' : typeof value;

  if (actualType !== expectedType) {
    return {
      field,
      message: `Expected ${expectedType}, got ${actualType}`,
      severity: 'error',
    };
  }

  return null;
}

/**
 * Detect conflicts between new and existing slugs.
 */
export function detectConflicts(
  newSlugs: string[],
  existingData: Record<string, any>,
  strategy: 'update' | 'skip' = 'skip'
): ConflictReport[] {
  const conflicts: ConflictReport[] = [];

  for (const slug of newSlugs) {
    if (slug in existingData) {
      conflicts.push({
        slug,
        existing: true,
        resolution: strategy === 'update' ? 'update' : 'skip',
        reason: `Slug "${slug}" already exists. Using ${strategy} strategy.`,
      });
    }
  }

  return conflicts;
}

/**
 * Generate timestamp for filenames.
 */
export function timestampFilename(prefix: string): string {
  const now = new Date();
  const iso = now.toISOString().replace(/[:.]/g, '-').split('Z')[0];
  return `${prefix}-${iso}.json`;
}

/**
 * Generate change log from transform operation.
 */
export function generateChangeLog(
  added: string[],
  updated: string[],
  skipped: string[],
  conflicts: ConflictReport[]
): string {
  const lines = [
    '=== TRANSFORMATION SUMMARY ===',
    `Added:    ${added.length} entries`,
    `Updated:  ${updated.length} entries`,
    `Skipped:  ${skipped.length} entries`,
    `Conflicts: ${conflicts.length} entries`,
    '',
  ];

  if (added.length > 0) {
    lines.push('Added entries:');
    added.slice(0, 10).forEach(s => lines.push(`  + ${s}`));
    if (added.length > 10) lines.push(`  ... and ${added.length - 10} more`);
    lines.push('');
  }

  if (updated.length > 0) {
    lines.push('Updated entries:');
    updated.slice(0, 10).forEach(s => lines.push(`  ~ ${s}`));
    if (updated.length > 10) lines.push(`  ... and ${updated.length - 10} more`);
    lines.push('');
  }

  if (conflicts.length > 0) {
    lines.push('Conflicts (skipped):');
    conflicts.slice(0, 5).forEach(c => lines.push(`  ⚠ ${c.slug}: ${c.reason}`));
    if (conflicts.length > 5) lines.push(`  ... and ${conflicts.length - 5} more`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Move file from pending → approved folder.
 */
export function moveToApproved(pendingPath: string): string {
  const approvedPath = pendingPath.replace('/pending/', '/approved/');
  const dir = path.dirname(approvedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.renameSync(pendingPath, approvedPath);
  return approvedPath;
}

/**
 * List all staged files in pending folder.
 */
export function listStagedFiles(site: string): string[] {
  const pendingDir = path.join(process.cwd(), 'seo-engine', 'staging', site, 'pending');

  if (!fs.existsSync(pendingDir)) {
    return [];
  }

  return fs.readdirSync(pendingDir).filter(f => f.endsWith('.staged.json'));
}

/**
 * List all approved files ready to merge.
 */
export function listApprovedFiles(site: string): string[] {
  const approvedDir = path.join(process.cwd(), 'seo-engine', 'staging', site, 'approved');

  if (!fs.existsSync(approvedDir)) {
    return [];
  }

  return fs.readdirSync(approvedDir).filter(f => f.endsWith('.approved.json'));
}
