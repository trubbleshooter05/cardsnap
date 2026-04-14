import { ValidationError, ValidationResult, ValidationRule } from '../transforms/types';
import { validateRequiredFields, validateFieldType } from '../transforms/utils';

/**
 * Abstract base class for all validators.
 * Handles common validation patterns and error reporting.
 */
export abstract class BaseValidator {
  protected site: string;
  protected dataType: string;

  constructor(site: string, dataType: string) {
    this.site = site;
    this.dataType = dataType;
  }

  /**
   * Main validation method. Must be implemented by subclass.
   */
  abstract validate(entry: any): ValidationResult;

  /**
   * Check required fields are present.
   */
  protected checkRequiredFields(entry: any, fields: string[]): ValidationError[] {
    return validateRequiredFields(entry, fields);
  }

  /**
   * Check field has correct type.
   */
  protected checkFieldType(entry: any, field: string, type: string): ValidationError | null {
    return validateFieldType(entry, field, type);
  }

  /**
   * Check field against a rule set.
   */
  protected checkField(entry: any, rule: ValidationRule): ValidationError | null {
    const value = entry[rule.field];

    // Check required
    if (rule.required && (value === undefined || value === null)) {
      return {
        field: rule.field,
        message: `Required field missing: ${rule.field}`,
        severity: 'error',
      };
    }

    if (value === undefined || value === null) {
      return null;
    }

    // Check type
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rule.type) {
      return {
        field: rule.field,
        message: `Expected ${rule.type}, got ${actualType}`,
        severity: 'error',
      };
    }

    // Check string constraints
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return {
          field: rule.field,
          message: `Too short: minimum ${rule.minLength} characters`,
          severity: 'error',
        };
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        return {
          field: rule.field,
          message: `Too long: maximum ${rule.maxLength} characters`,
          severity: 'error',
        };
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        return {
          field: rule.field,
          message: `Format invalid: must match ${rule.pattern}`,
          severity: 'error',
        };
      }

      if (rule.enum && !rule.enum.includes(value)) {
        return {
          field: rule.field,
          message: `Invalid value: must be one of ${rule.enum.join(', ')}`,
          severity: 'error',
        };
      }
    }

    return null;
  }

  /**
   * Generate validation result from errors and warnings.
   */
  protected generateReport(
    errors: ValidationError[] = [],
    warnings: ValidationError[] = []
  ): ValidationResult {
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format error message for display.
   */
  protected formatErrorMessage(field: string, expectation: string): string {
    return `${field}: ${expectation}`;
  }

  /**
   * Log validation results.
   */
  protected log(level: 'info' | 'warn' | 'error', message: string): void {
    const prefix = `[${this.site}:${this.dataType}]`;
    console.log(`${prefix} ${level.toUpperCase()}: ${message}`);
  }
}
