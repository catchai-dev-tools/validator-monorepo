import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

export enum DocumentTypeStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
}

@Entity({ name: 'DocumentTypes' })
export class DocumentType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'ingestion_config', type: 'jsonb', nullable: true })
  ingestionConfig!: object;

  @Column({
    type: 'enum',
    enum: DocumentTypeStatus,
    default: DocumentTypeStatus.DRAFT,
  })
  status!: DocumentTypeStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany('RuleSet', 'documentType')
  ruleSets!: any[];
  
  @OneToMany('BulkFile', 'documentType')
  bulkFiles!: any[];
}
