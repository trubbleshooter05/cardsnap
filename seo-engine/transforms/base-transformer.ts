import * as path from 'path';
import { TransformResult, ConflictReport, ValidationError, TransformOptions } from './types';
import {
  readJsonFile,
  writeJsonFile,
  readExistingData,
  detectConflicts,
  timestampFilename,
  generateChangeLog,
  validateRequiredFields,
} from './utils';

/**
 * Abstract base class for all site transformers.
 * Handles common concerns: staging, conflict detection, logging.
 */
export abstract class BaseTransformer {
  protected site: string;
  protected dataType: string;
  protected options: TransformOptions;

  constructor(site: string, dataType: string, options: Partial<TransformOptions> = {}) {
    this.site = site;
    this.dataType = dataType;
    this.options = {
      site,
      dataType,
      dryRun: options.dryRun || false,
      validate: options.validate || true,
      stageOnly: options.stageOnly || false,
      mergeApproved: options.mergeApproved || false,
      strategy: options.strategy || 'skip',
    };
  }

  /**
   * Main transform method. Must be implemented by subclass.
   */
  abstract transform(jsonFile: string): Promise<TransformResult>;

  /**
   * Stage entries for review before merge.
   * Writes to staging/{site}/pending/{timestamp}.staged.json
   */
  protected async stageForReview(
    entries: Record<string, any>[],
    conflicts: ConflictReport[],
    metadata: any = {}
  ): Promise<string> {
    const stagingDir = path.join(
      process.cwd(),
      'seo-engine',
      'staging',
      this.site,
      'pending'
    );

    // Create directory if doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(stagingDir)) {
      fs.mkdirSync(stagingDir, { recursive: true });
    }

    const filename = timestampFilename(`${this.dataType}`);
    const filePath = path.join(stagingDir, `${filename.replace('.json', '')}.staged.json`);

    const stagingData = {
      site: this.site,
      dataType: this.dataType,
      stagedAt: new Date().toISOString(),
      entries,
      conflicts,
      metadata,
    };

    writeJsonFile(filePath, stagingData);
    this.log('info', `Staged ${entries.length} entries to ${filePath}`);

    return filePath;
  }

  /**
   * Detect conflicts between new data and existing.
   */
  protected async detectConflicts(
    newData: Record<string, any>[],
    existingData: Record<string, any>
  ): Promise<ConflictReport[]> {
    const newSlugs = newData.map(d => d.slug || d.id);
    return detectConflicts(newSlugs, existingData, this.options.strategy);
  }

  /**
   * Merge new data with existing, respecting strategy.
   */
  protected mergeWithExisting(
    newData: Record<string, any>,
    existingData: Record<string, any>
  ): Record<string, any> {
    const merged = { ...existingData };

    for (const [slug, content] of Object.entries(newData)) {
      if (slug in merged && this.options.strategy === 'skip') {
        this.log('warn', `Skipping existing slug: ${slug}`);
        continue;
      }
      merged[slug] = content;
    }

    return merged;
  }

  /**
   * Validate structure of parsed JSON before transform.
   */
  protected validateStructure(
    json: any,
    requiredFields: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Array.isArray(json)) {
      errors.push({
        field: 'root',
        message: 'Expected array of entries',
        severity: 'error',
      });
      return errors;
    }

    json.forEach((entry, idx) => {
      const fieldErrors = validateRequiredFields(entry, requiredFields);
      errors.push(
        ...fieldErrors.map(err => ({
          ...err,
          field: `[${idx}].${err.field}`,
        }))
      );
    });

    return errors;
  }

  /**
   * Log messages with prefix for this transformer.
   */
  protected log(level: 'info' | 'warn' | 'error', message: string): void {
    const prefix = `[${this.site}:${this.dataType}]`;
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${prefix} ${level.toUpperCase()}: ${message}`);
  }

  /**
   * Generate summary of transform operation.
   */
  protected generateSummary(result: TransformResult): string {
    return [
      `Transform: ${this.site}/${this.dataType}`,
      `  Staged: ${result.staged}`,
      `  Conflicts: ${result.conflicts.length}`,
      `  Errors: ${result.errors.length}`,
      `  Path: ${result.path || 'N/A'}`,
    ].join('\n');
  }
}
