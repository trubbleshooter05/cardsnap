import * as fs from 'fs';
import * as path from 'path';
import { listApprovedFiles, readJsonFile, writeJsonFile } from './utils';

/**
 * Main orchestrator for running all transformers.
 * CLI interface for staging, validating, and merging SEO content.
 */

interface CliArgs {
  site?: string;
  stageOnly?: boolean;
  validate?: boolean;
  mergeApproved?: boolean;
  dryRun?: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {};

  process.argv.slice(2).forEach(arg => {
    if (arg === '--stage-only') args.stageOnly = true;
    if (arg === '--validate') args.validate = true;
    if (arg === '--merge-approved') args.mergeApproved = true;
    if (arg === '--dry-run') args.dryRun = true;
    if (arg.startsWith('--site=')) args.site = arg.split('=')[1];
  });

  return args;
}

async function findLatestHermesOutput(site: string): Promise<string | null> {
  const outputDir = path.join(process.cwd(), 'seo-engine', 'outputs', site);

  if (!fs.existsSync(outputDir)) {
    console.log(`No outputs directory for ${site}`);
    return null;
  }

  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log(`No JSON files found in ${outputDir}`);
    return null;
  }

  // Sort by filename (timestamp) and get latest
  files.sort();
  const latest = files[files.length - 1];

  return path.join(outputDir, latest);
}

async function stageCardSnapGradeOrSkip(jsonFile: string, dryRun = false): Promise<void> {
  // This will be called once CardSnapTransformer is ready
  console.log(`Would stage CardSnap grade-or-skip from: ${jsonFile}`);
  if (!dryRun) {
    console.log('(Transformer not yet implemented)');
  }
}

async function mergeApprovedForSite(site: string, dryRun = false): Promise<void> {
  const approvedFiles = listApprovedFiles(site);

  if (approvedFiles.length === 0) {
    console.log(`No approved files for ${site}`);
    return;
  }

  console.log(`Found ${approvedFiles.length} approved file(s) for ${site}`);

  for (const file of approvedFiles) {
    const filePath = path.join(
      process.cwd(),
      'seo-engine',
      'staging',
      site,
      'approved',
      file
    );

    if (dryRun) {
      console.log(`[DRY RUN] Would merge: ${file}`);
      const data = readJsonFile(filePath);
      console.log(`  Entries: ${data.entries?.length || 0}`);
    } else {
      console.log(`Merging: ${file}`);
      // Merge logic will be implemented by transformer
    }
  }
}

async function main(): Promise<void> {
  const args = parseArgs();

  console.log('=== Hermes → Next.js Transformer Orchestrator ===');
  console.log('');

  if (args.dryRun) {
    console.log('[DRY RUN MODE] - No changes will be made\n');
  }

  if (args.mergeApproved) {
    console.log('Merging approved entries...\n');

    if (args.site) {
      await mergeApprovedForSite(args.site, args.dryRun);
    } else {
      // Merge all sites
      const siteDirs = fs
        .readdirSync(path.join(process.cwd(), 'seo-engine', 'staging'))
        .filter(f => !f.startsWith('.'));

      for (const site of siteDirs) {
        await mergeApprovedForSite(site, args.dryRun);
      }
    }

    console.log('\nDone.');
    return;
  }

  // Stage new content
  console.log('Staging new content from Hermes outputs...\n');

  const targetSite = args.site || 'cardsnap'; // Start with CardSnap for MVP
  const latestOutput = await findLatestHermesOutput(targetSite);

  if (!latestOutput) {
    console.log('No new content to stage.');
    return;
  }

  console.log(`Found: ${path.basename(latestOutput)}`);

  if (targetSite === 'cardsnap') {
    await stageCardSnapGradeOrSkip(latestOutput, args.dryRun);
  } else {
    console.log(`Transformer for ${targetSite} not yet implemented (MVP)`);
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
