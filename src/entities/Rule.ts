import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
} from 'typeorm';

export enum RuleType {
  INTRA_FIELD = 'intra_field', // Simple rule within a single field (e.g., amount > 0)
  INTRA_RECORD = 'intra_record', // Rule involving multiple fields in the same record
  INTRA_BULK = 'intra_bulk', // Rule across the entire bulk file (e.g., uniqueness)
  CROSS_BULK_SET = 'cross_bulk_set', // Rule across a tagged set of bulk files
  CROSS_BULK_SINGLE = 'cross_bulk_single', // Rule against one other specific bulk file (e.g., previous month)
  DICTIONARY = 'dictionary', // Rule that checks against a predefined set of values
  EXTERNAL_API = 'external_api', // Rule that requires an external REST API call
}

@Entity({ name: 'Rules' })
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'field_name', type: 'text' })
  fieldName!: string;
  
  @Column({ type: 'enum', enum: RuleType })
  type!: RuleType;
  
  @Column({ type: 'jsonb', nullable: true })
  metadata!: object;

  @Column({ name: 'rule_content_hash', type: 'text', unique: true })
  ruleContentHash!: string;

  @Column({ name: 'rule_content', type: 'text' })
  ruleContent!: string; // The YAML content

  @ManyToMany('RuleSet', 'rules')
  ruleSets!: any[];
}
