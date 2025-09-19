import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Rule, RuleType } from '../entities/Rule';
import { RuleSet } from '../entities/RuleSet';
import { DocumentType } from '../entities/DocumentType';
import * as crypto from 'crypto';

export class RuleService {
  private ruleRepository: Repository<Rule>;
  private ruleSetRepository: Repository<RuleSet>;
  private documentTypeRepository: Repository<DocumentType>;

  constructor() {
    this.ruleRepository = AppDataSource.getRepository(Rule);
    this.ruleSetRepository = AppDataSource.getRepository(RuleSet);
    this.documentTypeRepository = AppDataSource.getRepository(DocumentType);
  }

  // Rule CRUD operations
  async createRule(data: {
    fieldName: string;
    type: RuleType;
    ruleContent: string;
    metadata?: object;
  }): Promise<Rule> {
    // Generate hash for rule content
    const ruleContentHash = crypto.createHash('sha256').update(data.ruleContent).digest('hex');

    // Check if rule with same hash already exists
    const existingRule = await this.ruleRepository.findOne({
      where: { ruleContentHash }
    });
    
    if (existingRule) {
      return existingRule; // Return existing rule instead of creating duplicate
    }

    const rule = this.ruleRepository.create({
      ...data,
      ruleContentHash,
    });

    return await this.ruleRepository.save(rule);
  }

  async getAllRules(): Promise<Rule[]> {
    return await this.ruleRepository.find({
      relations: ['ruleSets'],
    });
  }

  async getRuleById(id: string): Promise<Rule | null> {
    return await this.ruleRepository.findOne({
      where: { id },
      relations: ['ruleSets'],
    });
  }

  async getRulesByType(type: RuleType): Promise<Rule[]> {
    return await this.ruleRepository.find({
      where: { type },
      relations: ['ruleSets'],
    });
  }

  async getRulesByFieldName(fieldName: string): Promise<Rule[]> {
    return await this.ruleRepository.find({
      where: { fieldName },
      relations: ['ruleSets'],
    });
  }

  async updateRule(id: string, updateData: {
    fieldName?: string;
    type?: RuleType;
    ruleContent?: string;
    metadata?: object;
  }): Promise<Rule | null> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      return null;
    }

    // If rule content is being updated, recalculate hash
    if (updateData.ruleContent) {
      updateData.ruleContentHash = crypto.createHash('sha256').update(updateData.ruleContent).digest('hex');
    }

    Object.assign(rule, updateData);
    return await this.ruleRepository.save(rule);
  }

  async deleteRule(id: string): Promise<boolean> {
    const result = await this.ruleRepository.delete(id);
    return result.affected > 0;
  }

  // RuleSet CRUD operations
  async createRuleSet(data: {
    documentTypeId: string;
    version: number;
    description?: string;
    ruleIds?: string[];
  }): Promise<RuleSet> {
    const documentType = await this.documentTypeRepository.findOne({
      where: { id: data.documentTypeId }
    });
    
    if (!documentType) {
      throw new Error('Document type not found');
    }

    // Check if version already exists for this document type
    const existingRuleSet = await this.ruleSetRepository.findOne({
      where: { 
        documentType: { id: data.documentTypeId },
        version: data.version 
      }
    });

    if (existingRuleSet) {
      throw new Error(`RuleSet version ${data.version} already exists for this document type`);
    }

    const ruleSet = this.ruleSetRepository.create({
      version: data.version,
      description: data.description,
      documentType,
    });

    // Add rules if provided
    if (data.ruleIds && data.ruleIds.length > 0) {
      const rules = await this.ruleRepository.findByIds(data.ruleIds);
      ruleSet.rules = rules;
    }

    return await this.ruleSetRepository.save(ruleSet);
  }

  async getAllRuleSets(): Promise<RuleSet[]> {
    return await this.ruleSetRepository.find({
      relations: ['documentType', 'rules', 'validationRuns'],
    });
  }

  async getRuleSetById(id: string): Promise<RuleSet | null> {
    return await this.ruleSetRepository.findOne({
      where: { id },
      relations: ['documentType', 'rules', 'validationRuns'],
    });
  }

  async getRuleSetsByDocumentType(documentTypeId: string): Promise<RuleSet[]> {
    return await this.ruleSetRepository.find({
      where: { documentType: { id: documentTypeId } },
      relations: ['documentType', 'rules', 'validationRuns'],
      order: { version: 'DESC' },
    });
  }

  async getLatestRuleSetByDocumentType(documentTypeId: string): Promise<RuleSet | null> {
    return await this.ruleSetRepository.findOne({
      where: { documentType: { id: documentTypeId } },
      relations: ['documentType', 'rules'],
      order: { version: 'DESC' },
    });
  }

  async updateRuleSet(id: string, updateData: {
    description?: string;
    ruleIds?: string[];
  }): Promise<RuleSet | null> {
    const ruleSet = await this.ruleSetRepository.findOne({
      where: { id },
      relations: ['rules'],
    });
    
    if (!ruleSet) {
      return null;
    }

    if (updateData.description !== undefined) {
      ruleSet.description = updateData.description;
    }

    if (updateData.ruleIds) {
      const rules = await this.ruleRepository.findByIds(updateData.ruleIds);
      ruleSet.rules = rules;
    }

    return await this.ruleSetRepository.save(ruleSet);
  }

  async deleteRuleSet(id: string): Promise<boolean> {
    const result = await this.ruleSetRepository.delete(id);
    return result.affected > 0;
  }

  async addRulesToRuleSet(ruleSetId: string, ruleIds: string[]): Promise<RuleSet | null> {
    const ruleSet = await this.ruleSetRepository.findOne({
      where: { id: ruleSetId },
      relations: ['rules'],
    });

    if (!ruleSet) {
      return null;
    }

    const newRules = await this.ruleRepository.findByIds(ruleIds);
    const existingRuleIds = ruleSet.rules.map(rule => rule.id);
    
    // Add only new rules (avoid duplicates)
    const rulesToAdd = newRules.filter(rule => !existingRuleIds.includes(rule.id));
    ruleSet.rules = [...ruleSet.rules, ...rulesToAdd];

    return await this.ruleSetRepository.save(ruleSet);
  }

  async removeRulesFromRuleSet(ruleSetId: string, ruleIds: string[]): Promise<RuleSet | null> {
    const ruleSet = await this.ruleSetRepository.findOne({
      where: { id: ruleSetId },
      relations: ['rules'],
    });

    if (!ruleSet) {
      return null;
    }

    ruleSet.rules = ruleSet.rules.filter(rule => !ruleIds.includes(rule.id));
    return await this.ruleSetRepository.save(ruleSet);
  }
}
