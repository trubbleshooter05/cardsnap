import { BaseValidator } from './base-validator';
import { ValidationResult, ValidationRule } from '../transforms/types';

/**
 * Validator for CardSnap grade-or-skip pages.
 * Ensures Hermes output matches NicheContent interface.
 */
export class CardSnapValidator extends BaseValidator {
  constructor() {
    super('cardsnap', 'grade-or-skip');
  }

  validate(entry: any): ValidationResult {
    const errors = [];
    const warnings = [];

    // Required fields
    const requiredErrors = this.checkRequiredFields(entry, [
      'slug',
      'sport',
      'category',
      'seoTitle',
      'seoDescription',
      'h1',
      'subtitle',
      'gradingLogic',
      'keyCharacteristics',
      'roiExamples',
      'whenToGrade',
      'skipGrading',
      'marketInsight',
    ]);
    errors.push(...requiredErrors);

    // Slug format check
    if (entry.slug && !/^[a-z0-9-]+$/.test(entry.slug)) {
      errors.push({
        field: 'slug',
        message: `Invalid format. Must be lowercase letters, numbers, and hyphens only. Got: "${entry.slug}"`,
        severity: 'error',
      });
    }

    // Title length (SEO)
    if (entry.seoTitle) {
      const len = entry.seoTitle.length;
      if (len < 50) {
        warnings.push({
          field: 'seoTitle',
          message: `Too short (${len} chars). SEO best practice: 50-70 chars.`,
          severity: 'warning',
        });
      } else if (len > 70) {
        warnings.push({
          field: 'seoTitle',
          message: `Too long (${len} chars). SEO best practice: 50-70 chars.`,
          severity: 'warning',
        });
      }
    }

    // Description length (SEO)
    if (entry.seoDescription) {
      const len = entry.seoDescription.length;
      if (len < 120) {
        warnings.push({
          field: 'seoDescription',
          message: `Too short (${len} chars). SEO best practice: 120-160 chars.`,
          severity: 'warning',
        });
      } else if (len > 160) {
        warnings.push({
          field: 'seoDescription',
          message: `Too long (${len} chars). SEO best practice: 120-160 chars.`,
          severity: 'warning',
        });
      }
    }

    // Array validations
    const gradingLogicErr = this.validateArray(
      entry.gradingLogic,
      'gradingLogic',
      'string',
      3,
      'At least 3 items required'
    );
    if (gradingLogicErr) errors.push(gradingLogicErr);

    const keyCharsErr = this.validateArray(
      entry.keyCharacteristics,
      'keyCharacteristics',
      'object',
      3,
      'At least 3 items required'
    );
    if (keyCharsErr) errors.push(keyCharsErr);

    const roiErr = this.validateArray(
      entry.roiExamples,
      'roiExamples',
      'object',
      2,
      'At least 2 examples required'
    );
    if (roiErr) errors.push(roiErr);

    const whenErr = this.validateArray(
      entry.whenToGrade,
      'whenToGrade',
      'string',
      2,
      'At least 2 items required'
    );
    if (whenErr) errors.push(whenErr);

    const skipErr = this.validateArray(
      entry.skipGrading,
      'skipGrading',
      'string',
      2,
      'At least 2 items required'
    );
    if (skipErr) errors.push(skipErr);

    // Validate ROI examples structure
    if (Array.isArray(entry.roiExamples)) {
      entry.roiExamples.forEach((roi: any, idx: number) => {
        const roiErrors = this.validateRoiExample(roi);
        errors.push(
          ...roiErrors.map(e => ({
            ...e,
            field: `roiExamples[${idx}].${e.field}`,
          }))
        );
      });
    }

    // Schema validation
    if (entry.schema_jsonld) {
      if (entry.schema_jsonld['@type'] !== 'Article') {
        errors.push({
          field: 'schema_jsonld',
          message: `Expected @type "Article", got "${entry.schema_jsonld['@type']}"`,
          severity: 'error',
        });
      }
    }

    return this.generateReport(errors, warnings);
  }

  /**
   * Validate array field.
   */
  private validateArray(
    value: any,
    field: string,
    expectedItemType: string,
    minItems: number,
    minMsg: string
  ) {
    if (!Array.isArray(value)) {
      return {
        field,
        message: `Expected array, got ${typeof value}`,
        severity: 'error' as const,
      };
    }

    if (value.length < minItems) {
      return {
        field,
        message: `${minMsg} (got ${value.length})`,
        severity: 'error' as const,
      };
    }

    // Check item types
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const itemType = Array.isArray(item) ? 'array' : typeof item;
      if (itemType !== expectedItemType) {
        return {
          field: `${field}[${i}]`,
          message: `Expected ${expectedItemType}, got ${itemType}`,
          severity: 'error' as const,
        };
      }
    }

    return null;
  }

  /**
   * Validate ROI example object.
   */
  private validateRoiExample(roi: any) {
    const errors = [];

    const requiredFields = [
      'cardName',
      'rawValue',
      'psa9Value',
      'psa10Value',
      'gradingCost',
      'psa9Roi',
      'psa10Roi',
      'verdict',
      'reason',
    ];

    for (const field of requiredFields) {
      if (roi[field] === undefined || roi[field] === null) {
        errors.push({
          field,
          message: `Required field missing`,
          severity: 'error' as const,
        });
      }
    }

    // Verdict validation
    if (roi.verdict && !['strong', 'moderate', 'skip'].includes(roi.verdict)) {
      errors.push({
        field: 'verdict',
        message: `Must be one of: strong, moderate, skip. Got: "${roi.verdict}"`,
        severity: 'error' as const,
      });
    }

    // Numeric validations
    if (typeof roi.rawValue === 'number' && roi.rawValue < 0) {
      errors.push({
        field: 'rawValue',
        message: `Must be >= 0`,
        severity: 'error' as const,
      });
    }

    return errors;
  }
}
