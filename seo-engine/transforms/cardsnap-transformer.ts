import * as path from 'path';
import { BaseTransformer } from './base-transformer';
import { CardSnapValidator } from '../validators/cardsnap-validator';
import { TransformResult, ValidationError } from './types';
import { readJsonFile, readExistingData } from './utils';

/**
 * Transformer for CardSnap grade-or-skip pages.
 * Converts Hermes JSON output into NicheContent format.
 */
export class CardSnapGradeOrSkipTransformer extends BaseTransformer {
  private validator: CardSnapValidator;

  constructor() {
    super('cardsnap', 'grade-or-skip');
    this.validator = new CardSnapValidator();
  }

  /**
   * Main transformation method.
   */
  async transform(jsonFile: string): Promise<TransformResult> {
    try {
      this.log('info', `Starting transformation from ${path.basename(jsonFile)}`);

      // 1. Read Hermes JSON
      const hermesData = readJsonFile(jsonFile);
      this.log('info', `Read ${hermesData.length} entries from Hermes`);

      // 2. Validate structure
      if (!Array.isArray(hermesData)) {
        return {
          success: false,
          staged: 0,
          merged: 0,
          errors: [
            {
              field: 'root',
              message: 'Expected array of entries',
              severity: 'error',
            },
          ],
          conflicts: [],
          message: 'Invalid JSON structure',
        };
      }

      // 3. Validate each entry
      const errors: ValidationError[] = [];
      const validEntries: any[] = [];

      for (const entry of hermesData) {
        const result = this.validator.validate(entry);

        if (!result.valid) {
          errors.push(...result.errors);
        } else {
          validEntries.push(entry);
        }

        if (result.warnings.length > 0) {
          this.log('warn', `${entry.slug}: ${result.warnings[0].message}`);
        }
      }

      if (errors.length > 0) {
        this.log('error', `Validation failed: ${errors.length} error(s)`);
        return {
          success: false,
          staged: 0,
          merged: 0,
          errors,
          conflicts: [],
          message: `Validation failed with ${errors.length} error(s)`,
        };
      }

      this.log('info', `Validated ${validEntries.length} entries`);

      // 4. Transform to NicheContent format
      const transformedEntries = validEntries.map(entry => this.transformEntry(entry));

      // 5. Read existing CardSnap data
      const existingDataPath = path.join(
        process.cwd(),
        'cardsnap',
        'lib',
        'generated-niche-content.ts'
      );

      let existingData: Record<string, any> = {};
      try {
        existingData = readExistingData(existingDataPath);
        this.log('info', `Read ${Object.keys(existingData).length} existing entries`);
      } catch (err: any) {
        this.log('warn', `Could not read existing data: ${err.message}`);
      }

      // 6. Detect conflicts
      const conflicts = await this.detectConflicts(transformedEntries, existingData);
      if (conflicts.length > 0) {
        this.log('warn', `Found ${conflicts.length} conflict(s)`);
      }

      // 7. Stage for review
      const stagedPath = await this.stageForReview(transformedEntries, conflicts, {
        sourceFile: path.basename(jsonFile),
        strategy: this.options.strategy,
      });

      this.log('info', `Staged ${transformedEntries.length} entries for review`);

      return {
        success: true,
        staged: transformedEntries.length,
        path: stagedPath,
        errors: [],
        conflicts,
        message: `Staged ${transformedEntries.length} entries for review at ${stagedPath}`,
      };
    } catch (err: any) {
      this.log('error', err.message);
      return {
        success: false,
        staged: 0,
        merged: 0,
        errors: [
          {
            field: 'transform',
            message: err.message,
            severity: 'error',
          },
        ],
        conflicts: [],
        message: `Transform failed: ${err.message}`,
      };
    }
  }

  /**
   * Transform a single Hermes entry to NicheContent format.
   */
  private transformEntry(entry: any): Record<string, any> {
    return {
      slug: entry.slug,
      sport: entry.sport,
      category: entry.category,
      seoTitle: entry.seoTitle,
      seoDescription: entry.seoDescription,
      h1: entry.h1,
      subtitle: entry.subtitle,
      gradingLogic: entry.gradingLogic,
      keyCharacteristics: entry.keyCharacteristics,
      roiExamples: entry.roiExamples,
      whenToGrade: entry.whenToGrade,
      skipGrading: entry.skipGrading,
      marketInsight: entry.marketInsight,
    };
  }
}

/**
 * Main CLI entry point.
 */
async function main() {
  const args = process.argv.slice(2);
  let jsonFile = args[0];

  if (!jsonFile) {
    // Try to find latest Hermes output
    const fs = require('fs');
    const outputDir = path.join(process.cwd(), 'seo-engine', 'outputs', 'cardsnap');

    if (fs.existsSync(outputDir)) {
      const files = fs
        .readdirSync(outputDir)
        .filter((f: string) => f.endsWith('.json'))
        .sort();

      if (files.length > 0) {
        jsonFile = path.join(outputDir, files[files.length - 1]);
      }
    }
  }

  if (!jsonFile) {
    console.error('Usage: npx tsx cardsnap-transformer.ts <path-to-hermes.json>');
    console.error('   or: npx tsx cardsnap-transformer.ts (auto-find latest)');
    process.exit(1);
  }

  const transformer = new CardSnapGradeOrSkipTransformer();
  const result = await transformer.transform(jsonFile);

  console.log('');
  console.log(result.message);
  console.log('');

  if (!result.success) {
    console.log('Errors:');
    result.errors.forEach(e => console.log(`  ${e.field}: ${e.message}`));
    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}
