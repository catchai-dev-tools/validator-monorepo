import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { ValidationRun, RunStatus, ValidationState, ValidationSummary } from '../entities/ValidationRun';
import { User } from '../entities/User';
import { BulkFile } from '../entities/BulkFile';
import { RuleSet } from '../entities/RuleSet';

export class ValidationService {
  private validationRunRepository: Repository<ValidationRun>;
  private userRepository: Repository<User>;
  private bulkFileRepository: Repository<BulkFile>;
  private ruleSetRepository: Repository<RuleSet>;

  constructor() {
    this.validationRunRepository = AppDataSource.getRepository(ValidationRun);
    this.userRepository = AppDataSource.getRepository(User);
    this.bulkFileRepository = AppDataSource.getRepository(BulkFile);
    this.ruleSetRepository = AppDataSource.getRepository(RuleSet);
  }

  async createValidationRun(data: {
    userId: string;
    bulkFileId: string;
    ruleSetId: string;
    state?: ValidationState;
  }): Promise<ValidationRun> {
    // Verify all related entities exist
    const user = await this.userRepository.findOne({ where: { id: data.userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const bulkFile = await this.bulkFileRepository.findOne({ where: { id: data.bulkFileId } });
    if (!bulkFile) {
      throw new Error('Bulk file not found');
    }

    const ruleSet = await this.ruleSetRepository.findOne({ where: { id: data.ruleSetId } });
    if (!ruleSet) {
      throw new Error('Rule set not found');
    }

    const validationRun = this.validationRunRepository.create({
      state: data.state || ValidationState.DRAFT,
      status: RunStatus.PENDING,
      user,
      bulkFile,
      ruleSet,
    });

    return await this.validationRunRepository.save(validationRun);
  }

  async getAllValidationRuns(): Promise<ValidationRun[]> {
    return await this.validationRunRepository.find({
      relations: ['user', 'bulkFile', 'ruleSet', 'bulkFile.documentType'],
      order: { submittedAt: 'DESC' },
    });
  }

  async getValidationRunById(id: string): Promise<ValidationRun | null> {
    return await this.validationRunRepository.findOne({
      where: { id },
      relations: ['user', 'bulkFile', 'ruleSet', 'bulkFile.documentType', 'ruleSet.rules'],
    });
  }

  async getValidationRunsByUser(userId: string): Promise<ValidationRun[]> {
    return await this.validationRunRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'bulkFile', 'ruleSet', 'bulkFile.documentType'],
      order: { submittedAt: 'DESC' },
    });
  }

  async getValidationRunsByBulkFile(bulkFileId: string): Promise<ValidationRun[]> {
    return await this.validationRunRepository.find({
      where: { bulkFile: { id: bulkFileId } },
      relations: ['user', 'bulkFile', 'ruleSet', 'bulkFile.documentType'],
      order: { submittedAt: 'DESC' },
    });
  }

  async getValidationRunsByStatus(status: RunStatus): Promise<ValidationRun[]> {
    return await this.validationRunRepository.find({
      where: { status },
      relations: ['user', 'bulkFile', 'ruleSet', 'bulkFile.documentType'],
      order: { submittedAt: 'DESC' },
    });
  }

  async getValidationRunsByState(state: ValidationState): Promise<ValidationRun[]> {
    return await this.validationRunRepository.find({
      where: { state },
      relations: ['user', 'bulkFile', 'ruleSet', 'bulkFile.documentType'],
      order: { submittedAt: 'DESC' },
    });
  }

  async updateValidationRunStatus(
    id: string, 
    status: RunStatus, 
    summary?: ValidationSummary,
    reportUrls?: {
      recordSummaryReportUrl?: string;
      fieldDetailReportUrl?: string;
    }
  ): Promise<ValidationRun | null> {
    const validationRun = await this.validationRunRepository.findOne({ where: { id } });
    if (!validationRun) {
      return null;
    }

    validationRun.status = status;
    
    if (summary) {
      validationRun.summary = summary;
    }

    if (reportUrls?.recordSummaryReportUrl) {
      validationRun.recordSummaryReportUrl = reportUrls.recordSummaryReportUrl;
    }

    if (reportUrls?.fieldDetailReportUrl) {
      validationRun.fieldDetailReportUrl = reportUrls.fieldDetailReportUrl;
    }

    if (status === RunStatus.COMPLETED || status === RunStatus.FAILED) {
      validationRun.completedAt = new Date();
    }

    return await this.validationRunRepository.save(validationRun);
  }

  async updateValidationRunState(id: string, state: ValidationState): Promise<ValidationRun | null> {
    const validationRun = await this.validationRunRepository.findOne({ where: { id } });
    if (!validationRun) {
      return null;
    }

    validationRun.state = state;
    return await this.validationRunRepository.save(validationRun);
  }

  async deleteValidationRun(id: string): Promise<boolean> {
    const result = await this.validationRunRepository.delete(id);
    return result.affected > 0;
  }

  // Helper method to promote a draft run to accepted
  async acceptValidationRun(id: string): Promise<ValidationRun | null> {
    const validationRun = await this.validationRunRepository.findOne({ where: { id } });
    if (!validationRun) {
      return null;
    }

    if (validationRun.state !== ValidationState.DRAFT) {
      throw new Error('Only draft validation runs can be accepted');
    }

    if (validationRun.status !== RunStatus.COMPLETED) {
      throw new Error('Only completed validation runs can be accepted');
    }

    validationRun.state = ValidationState.ACCEPTED;
    return await this.validationRunRepository.save(validationRun);
  }

  // Helper method to get validation runs that can be cleaned up (draft runs older than X days)
  async getDraftRunsForCleanup(daysOld: number = 30): Promise<ValidationRun[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await this.validationRunRepository
      .createQueryBuilder('vr')
      .where('vr.state = :state', { state: ValidationState.DRAFT })
      .andWhere('vr.submitted_at < :cutoffDate', { cutoffDate })
      .getMany();
  }

  // Get summary statistics
  async getValidationRunStats(): Promise<{
    total: number;
    byStatus: Record<RunStatus, number>;
    byState: Record<ValidationState, number>;
  }> {
    const total = await this.validationRunRepository.count();
    
    const statusCounts = await this.validationRunRepository
      .createQueryBuilder('vr')
      .select('vr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vr.status')
      .getRawMany();

    const stateCounts = await this.validationRunRepository
      .createQueryBuilder('vr')
      .select('vr.state', 'state')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vr.state')
      .getRawMany();

    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item.status as RunStatus] = parseInt(item.count);
      return acc;
    }, {} as Record<RunStatus, number>);

    const byState = stateCounts.reduce((acc, item) => {
      acc[item.state as ValidationState] = parseInt(item.count);
      return acc;
    }, {} as Record<ValidationState, number>);

    return { total, byStatus, byState };
  }
}
