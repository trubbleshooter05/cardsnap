/**
 * Shared types for all transformer and validator systems.
 * Used by CardSnap, MoviesLike, FursBliss, and SnapBrand transformers.
 */

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface TransformResult {
  success: boolean;
  staged: number;
  merged?: number;
  path?: string;
  errors: ValidationError[];
  conflicts: ConflictReport[];
  message: string;
}

export interface ConflictReport {
  slug: string;
  existing: boolean;
  resolution: 'skip' | 'update' | 'pending';
  reason?: string;
}

export interface StagingEntry {
  id: string;
  siteId: 'cardsnap' | 'movieslike' | 'fursbliss' | 'snapbrand';
  dataType: string;
  entries: Record<string, any>[];
  validations: ValidationError[];
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationRule {
  field: string;
  type: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: string[];
}

export interface TransformOptions {
  site: string;
  dataType: string;
  dryRun?: boolean;
  validate?: boolean;
  stageOnly?: boolean;
  mergeApproved?: boolean;
  strategy?: 'update' | 'skip';
}

export interface ChangeLog {
  added: string[];
  updated: string[];
  skipped: string[];
  conflicts: ConflictReport[];
  timestamp: Date;
}
