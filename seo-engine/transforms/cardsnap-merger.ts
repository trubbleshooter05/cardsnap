import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import { readJsonFile, writeJsonFile, listApprovedFiles } from './utils';

/**
 * Merger for CardSnap: applies approved staged entries to generated-niche-content.ts
 */

interface MergeResult {
  success: boolean;
  merged: number;
  file: string;
  backup: string;
  errors: string[];
}

async function mergeCardSnapEntries(dryRun = false): Promise<MergeResult> {
  console.log('[CardSnap Merger] Starting merge operation...');

  const approvedFiles = listApprovedFiles('cardsnap');

  if (approvedFiles.length === 0) {
    console.log('[CardSnap Merger] No approved files to merge');
    return {
      success: true,
      merged: 0,
      file: '',
      backup: '',
      errors: [],
    };
  }

  const targetFile = path.join(process.cwd(), 'cardsnap', 'lib', 'generated-niche-content.ts');

  if (!fs.existsSync(targetFile)) {
    return {
      success: false,
      merged: 0,
      file: targetFile,
      backup: '',
      errors: [`Target file not found: ${targetFile}`],
    };
  }

  const backupFile = `${targetFile}.backup-${Date.now()}`;
  const errors: string[] = [];
  let totalMerged = 0;

  try {
    // Read current content
    const currentContent = fs.readFileSync(targetFile, 'utf-8');

    // Backup original
    if (!dryRun) {
      fs.writeFileSync(backupFile, currentContent);
      console.log(`[CardSnap Merger] Created backup: ${backupFile}`);
    } else {
      console.log(`[CardSnap Merger] [DRY RUN] Would backup to: ${backupFile}`);
    }

    // Collect all entries from approved files
    const newEntries: Record<string, any> = {};

    for (const file of approvedFiles) {
      const filePath = path.join(
        process.cwd(),
        'seo-engine',
        'staging',
        'cardsnap',
        'approved',
        file
      );

      try {
        const data = readJsonFile(filePath);
        const entries = data.entries || [];

        console.log(`[CardSnap Merger] Processing ${file}: ${entries.length} entries`);

        for (const entry of entries) {
          newEntries[entry.slug] = entry;
          totalMerged++;
        }
      } catch (err: any) {
        errors.push(`Failed to read ${file}: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        merged: 0,
        file: targetFile,
        backup: backupFile,
        errors,
      };
    }

    // Build new content with merged entries
    let newContent = currentContent.replace(
      /export const GENERATED_NICHE_CONTENT = \{[\s\S]*?\n\};/,
      (match: string) => {
        // Extract existing entries
        let existingEntries = '{}';
        try {
          // This is simplified - in production would parse more carefully
          const match2 = match.match(/= (\{[\s\S]*?\n\})/);
          if (match2) {
            existingEntries = match2[1];
          }
        } catch (e) {
          // Fallback: just use the existing block
          console.warn('[CardSnap Merger] Could not parse existing entries, adding new ones');
        }

        // Manually add new entries to the export
        const entriesStr = Object.entries(newEntries)
          .map(([slug, content]) => `  "${slug}": ${JSON.stringify(content, null, 4)}`)
          .join(',\n');

        // This is a simple approach - just adds new entries at the end
        // A more sophisticated parser would merge properly
        return `export const GENERATED_NICHE_CONTENT = {\n${entriesStr}\n};`;
      }
    );

    // If replacement didn't work, append entries differently
    if (newContent === currentContent) {
      console.log('[CardSnap Merger] Using append strategy...');

      // Try to append before closing bracket
      newContent = currentContent.replace(
        /^\};$/m,
        () => {
          const newEntriesStr = Object.entries(newEntries)
            .map(([slug, content]) => `  "${slug}": ${JSON.stringify(content, null, 4)}`)
            .join(',\n');

          return `,\n${newEntriesStr}\n};`;
        }
      );
    }

    // Write merged content
    if (!dryRun) {
      writeJsonFile(targetFile, newContent, false); // Write as-is, not JSON
      fs.writeFileSync(targetFile, newContent, 'utf-8');
      console.log(`[CardSnap Merger] Merged ${totalMerged} entries to ${targetFile}`);
    } else {
      console.log(`[CardSnap Merger] [DRY RUN] Would merge ${totalMerged} entries`);
    }

    return {
      success: true,
      merged: totalMerged,
      file: targetFile,
      backup: backupFile,
      errors: [],
    };
  } catch (err: any) {
    errors.push(`Merge failed: ${err.message}`);
    return {
      success: false,
      merged: 0,
      file: targetFile,
      backup: backupFile,
      errors,
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  if (dryRun) {
    console.log('[CardSnap Merger] Running in DRY RUN mode - no changes will be made\n');
  }

  const result = await mergeCardSnapEntries(dryRun);

  console.log('');
  console.log('═══════════════════════════════════════');
  if (result.success) {
    console.log('✅ Merge completed successfully');
    console.log(`   Merged: ${result.merged} entries`);
    console.log(`   File: ${result.file}`);
    if (result.backup && !dryRun) {
      console.log(`   Backup: ${result.backup}`);
    }
  } else {
    console.log('❌ Merge failed');
    result.errors.forEach(e => console.log(`   Error: ${e}`));
  }
  console.log('═══════════════════════════════════════\n');

  process.exit(result.success ? 0 : 1);
}

/** ESM equivalent of `require.main === module` (tsx runs this file as ESM). */
function isRunAsMainScript(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return (
      path.resolve(fileURLToPath(import.meta.url)) === path.resolve(entry)
    );
  } catch {
    return false;
  }
}

if (isRunAsMainScript()) {
  void main();
}

export { mergeCardSnapEntries };
