import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

export enum IngestionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity({ name: 'BulkFiles' })
export class BulkFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'original_file_name', type: 'text' })
  originalFileName!: string;

  @Column({
    type: 'enum',
    enum: IngestionStatus,
    default: IngestionStatus.PENDING,
  })
  ingestionStatus!: IngestionStatus;

  @Column({ name: 'raw_file_url', type: 'text' })
  rawFileUrl!: string;

  @Column({ name: 'clean_file_url', type: 'text', nullable: true })
  cleanFileUrl!: string;

  @Column({ name: 'ingestion_summary', type: 'jsonb', nullable: true })
  ingestionSummary!: { recordCount?: number; errors?: string[] };

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;

  @Column({ name: 'ingestion_completed_at', type: 'timestamptz', nullable: true })
  ingestionCompletedAt!: Date;

  @ManyToOne('DocumentType', 'bulkFiles', { nullable: false })
  documentType!: any;

  @OneToMany('ValidationRun', 'bulkFile')
  validationRuns!: any[];
}
