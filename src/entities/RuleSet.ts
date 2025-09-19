import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Unique,
} from 'typeorm';

@Entity({ name: 'RuleSets' })
@Unique(['documentType', 'version'])
export class RuleSet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'integer' })
  version!: number;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne('DocumentType', 'ruleSets', {
    onDelete: 'CASCADE',
    nullable: false,
  })
  documentType!: any;

  @ManyToMany('Rule', 'ruleSets')
  @JoinTable({
    name: 'RuleSet_Rules',
    joinColumn: { name: 'rule_set_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rule_id', referencedColumnName: 'id' },
  })
  rules!: any[];

  @OneToMany('ValidationRun', 'ruleSet')
  validationRuns!: any[];
}
