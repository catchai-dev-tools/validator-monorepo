import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';

export enum RunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ValidationState {
  DRAFT = 'draft',
  ACCEPTED = 'accepted',
}

export interface ValidationSummary {
  totalRecords: number;
  passedRecords: number;
  failedRecords: number;
  warningRecords: number;
  durationSeconds: number;
  errorBreakdown?: { [ruleOrFieldName: string]: number };
}

export interface RecordSummary {
  recordIdentifier: string;
  status: 'passed' | 'failed' | 'warning';
  errorCount: number;
  warningCount: number;
  failedFields?: string[];
}

export interface FieldDetailResult {
  recordIdentifier: string;
  fieldName: string;
  ruleName: string;
  testName: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
}

@Entity({ name: 'ValidationRuns' })
export class ValidationRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ValidationState,
    default: ValidationState.DRAFT,
  })
  state!: ValidationState;

  @Index()
  @Column({
    type: 'enum',
    enum: RunStatus,
    default: RunStatus.PENDING,
  })
  status!: RunStatus;

  @Column({ type: 'jsonb', nullable: true })
  summary!: ValidationSummary;

  @Column({ name: 'record_summary_report_url', type: 'text', nullable: true })
  recordSummaryReportUrl!: string;

  @Column({ name: 'field_detail_report_url', type: 'text', nullable: true })
  fieldDetailReportUrl!: string;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date;

  @ManyToOne('User', 'validationRuns', { nullable: false })
  user!: any;
  
  @ManyToOne('BulkFile', 'validationRuns', { nullable: false })
  bulkFile!: any;

  @ManyToOne('RuleSet', 'validationRuns', {
    nullable: false,
  })
  ruleSet!: any;
}
