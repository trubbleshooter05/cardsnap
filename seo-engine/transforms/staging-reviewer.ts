import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { listStagedFiles, moveToApproved } from './utils';

/**
 * Interactive CLI tool to review and approve staged entries.
 * Helps user decide which staged transformations to merge.
 */

interface ReviewChoice {
  action: 'approve' | 'skip' | 'show' | 'exit';
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function formatEntryPreview(entry: any, limit = 3): string {
  const lines = [];
  const keys = Object.keys(entry).slice(0, limit);

  for (const key of keys) {
    let value = entry[key];
    if (typeof value === 'string' && value.length > 50) {
      value = value.substring(0, 47) + '...';
    }
    if (typeof value === 'object') {
      value = JSON.stringify(value).substring(0, 40) + '...';
    }
    lines.push(`  ${key}: ${value}`);
  }

  return lines.join('\n');
}

function displayStagedFile(filePath: string, limit = 5): void {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const entries = data.entries || [];

  console.log('\n═══════════════════════════════════════');
  console.log(`📄 File: ${path.basename(filePath)}`);
  console.log(`📊 Entries: ${entries.length}`);
  console.log(`🕐 Staged: ${data.stagedAt}`);

  if (data.conflicts && data.conflicts.length > 0) {
    console.log(`⚠️  Conflicts: ${data.conflicts.length}`);
    data.conflicts.slice(0, 3).forEach((c: any) => {
      console.log(`     - ${c.slug}: ${c.reason}`);
    });
  }

  console.log('\nEntries:');

  entries.slice(0, limit).forEach((entry: any, idx: number) => {
    const slug = entry.slug || entry.id || `[${idx}]`;
    const title = entry.seoTitle || entry.title || entry.name || '';
    console.log(`\n  [${idx + 1}] ${slug}`);
    if (title) console.log(`      Title: ${title.substring(0, 60)}...`);
  });

  if (entries.length > limit) {
    console.log(`\n  ... and ${entries.length - limit} more entries`);
  }

  console.log('═══════════════════════════════════════\n');
}

async function reviewFile(filePath: string): Promise<'approve' | 'skip'> {
  displayStagedFile(filePath);

  while (true) {
    const answer = await question('Action? [a]pprove / [s]kip / [d]etails / [q]uit: ');

    switch (answer.toLowerCase().trim()) {
      case 'a':
      case 'approve':
        return 'approve';

      case 's':
      case 'skip':
        return 'skip';

      case 'd':
      case 'details':
        console.log(JSON.stringify(JSON.parse(fs.readFileSync(filePath, 'utf-8')), null, 2));
        continue;

      case 'q':
      case 'quit':
        rl.close();
        process.exit(0);

      default:
        console.log('Invalid action. Try again.');
        continue;
    }
  }
}

async function main(): Promise<void> {
  const site = process.argv[3] || 'cardsnap';

  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Hermes → Next.js Staging Reviewer      ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const stagedFiles = listStagedFiles(site);

  if (stagedFiles.length === 0) {
    console.log(`No staged files found for ${site}`);
    rl.close();
    return;
  }

  console.log(`Found ${stagedFiles.length} staged file(s) for ${site}\n`);

  let approved = 0;
  let skipped = 0;

  for (const file of stagedFiles) {
    const filePath = path.join(
      process.cwd(),
      'seo-engine',
      'staging',
      site,
      'pending',
      file
    );

    const decision = await reviewFile(filePath);

    if (decision === 'approve') {
      moveToApproved(filePath);
      approved++;
      console.log('✅ Approved and moved to approved/ folder\n');
    } else {
      skipped++;
      console.log('⏭️  Skipped (left in pending/ folder)\n');
    }
  }

  console.log('╔══════════════════════════════════════════╗');
  console.log(`║  Review Complete                         ║`);
  console.log(`║  Approved: ${String(approved).padEnd(33)}║`);
  console.log(`║  Skipped:  ${String(skipped).padEnd(33)}║`);
  console.log('╚══════════════════════════════════════════╝\n');

  console.log(`Next: npx tsx transforms/run-all-transforms.ts --merge-approved\n`);

  rl.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});
