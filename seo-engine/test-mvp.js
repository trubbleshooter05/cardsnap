#!/usr/bin/env node

/**
 * MVP Test Script - Tests the Hermes → CardSnap pipeline manually
 * Run: node seo-engine/test-mvp.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('╔════════════════════════════════════════╗');
console.log('║  CardSnap Transformer MVP Test       ║');
console.log('╚════════════════════════════════════════╝\n');

// 1. Find latest Hermes output
console.log('Step 1: Finding latest Hermes output...');
const outputDir = path.join(projectRoot, 'seo-engine', 'outputs', 'cardsnap');
const files = fs
  .readdirSync(outputDir)
  .filter(f => f.endsWith('.json'))
  .sort();

if (files.length === 0) {
  console.error('❌ No Hermes output files found');
  process.exit(1);
}

const latestFile = files[files.length - 1];
const filePath = path.join(outputDir, latestFile);
console.log(`✓ Found: ${latestFile}\n`);

// 2. Read and validate JSON
console.log('Step 2: Reading and parsing JSON...');
let hermesData;
try {
  const content = fs.readFileSync(filePath, 'utf-8');
  hermesData = JSON.parse(content);
  console.log(`✓ Parsed ${hermesData.length} entries\n`);
} catch (err) {
  console.error(`❌ Failed to parse JSON: ${err.message}`);
  process.exit(1);
}

// 3. Validate structure
console.log('Step 3: Validating entry structure...');
const requiredFields = [
  'slug',
  'sport',
  'seoTitle',
  'h1',
  'gradingLogic',
  'roiExamples',
  'keyCharacteristics',
];

let validCount = 0;
let errors = [];

hermesData.forEach((entry, idx) => {
  for (const field of requiredFields) {
    if (!entry[field]) {
      errors.push(`Entry ${idx}: Missing required field "${field}"`);
    }
  }

  // Validate arrays
  if (!Array.isArray(entry.gradingLogic) || entry.gradingLogic.length < 3) {
    errors.push(`Entry ${idx}: gradingLogic must be array with ≥3 items`);
  }

  if (!Array.isArray(entry.roiExamples) || entry.roiExamples.length < 2) {
    errors.push(`Entry ${idx}: roiExamples must be array with ≥2 items`);
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(entry.slug)) {
    errors.push(`Entry ${idx}: slug "${entry.slug}" invalid format`);
  }

  if (errors.length === 0 || idx === 0) {
    validCount++;
  }
});

console.log(`✓ Validated ${validCount} entries\n`);

if (errors.length > 0) {
  console.log('⚠️  Validation warnings/errors:');
  errors.slice(0, 5).forEach(e => console.log(`   ${e}`));
  if (errors.length > 5) console.log(`   ... and ${errors.length - 5} more`);
  console.log('');
}

// 4. Create staging directory
console.log('Step 4: Creating staging directories...');
const stagingPendingDir = path.join(projectRoot, 'seo-engine', 'staging', 'cardsnap', 'pending');
const stagingApprovedDir = path.join(projectRoot, 'seo-engine', 'staging', 'cardsnap', 'approved');

if (!fs.existsSync(stagingPendingDir)) {
  fs.mkdirSync(stagingPendingDir, { recursive: true });
}
if (!fs.existsSync(stagingApprovedDir)) {
  fs.mkdirSync(stagingApprovedDir, { recursive: true });
}
console.log(`✓ Created staging directories\n`);

// 5. Write staged entries
console.log('Step 5: Writing staged entries...');
const stagedFilename = `grade-or-skip-${new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0]}.staged.json`;
const stagedPath = path.join(stagingPendingDir, stagedFilename);

const stagedData = {
  site: 'cardsnap',
  dataType: 'grade-or-skip',
  stagedAt: new Date().toISOString(),
  entries: hermesData.slice(0, 1), // Stage just first entry for MVP test
  conflicts: [],
  metadata: {
    sourceFile: latestFile,
    strategy: 'skip',
  },
};

try {
  fs.writeFileSync(stagedPath, JSON.stringify(stagedData, null, 2));
  console.log(`✓ Staged entries to:\n   ${stagedPath}\n`);
} catch (err) {
  console.error(`❌ Failed to write staged file: ${err.message}`);
  process.exit(1);
}

// 6. Show what's next
console.log('╔════════════════════════════════════════╗');
console.log('║  MVP Test Complete!                  ║');
console.log('╚════════════════════════════════════════╝\n');

console.log('Next steps:\n');
console.log('1. Review staged entries:');
console.log(`   cat ${stagedPath}\n`);

console.log('2. Approve entries (move to approved folder):');
console.log(`   npx tsx seo-engine/transforms/staging-reviewer.ts --site cardsnap\n`);

console.log('3. Or manually approve:');
console.log(`   mv ${stagedPath} ${stagingApprovedDir}/\n`);

console.log('4. Merge approved entries:');
console.log(`   npx tsx seo-engine/transforms/cardsnap-merger.ts\n`);

console.log('5. Build to verify:');
console.log(`   npm run build\n`);
