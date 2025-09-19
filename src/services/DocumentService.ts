import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { DocumentType } from '../entities/DocumentType';
import { BulkFile, IngestionStatus } from '../entities/BulkFile';

export class DocumentService {
  private documentTypeRepository: Repository<DocumentType>;
  private bulkFileRepository: Repository<BulkFile>;

  constructor() {
    this.documentTypeRepository = AppDataSource.getRepository(DocumentType);
    this.bulkFileRepository = AppDataSource.getRepository(BulkFile);
  }

  // DocumentType CRUD operations
  async createDocumentType(data: {
    name: string;
    description?: string;
    ingestionConfig?: object;
  }): Promise<DocumentType> {
    const documentType = this.documentTypeRepository.create(data);
    return await this.documentTypeRepository.save(documentType);
  }

  async getAllDocumentTypes(): Promise<DocumentType[]> {
    return await this.documentTypeRepository.find({
      relations: ['ruleSets', 'bulkFiles'],
    });
  }

  async getDocumentTypeById(id: string): Promise<DocumentType | null> {
    return await this.documentTypeRepository.findOne({
      where: { id },
      relations: ['ruleSets', 'bulkFiles'],
    });
  }

  async updateDocumentType(id: string, updateData: {
    name?: string;
    description?: string;
    ingestionConfig?: object;
  }): Promise<DocumentType | null> {
    const documentType = await this.documentTypeRepository.findOne({ where: { id } });
    if (!documentType) {
      return null;
    }

    Object.assign(documentType, updateData);
    return await this.documentTypeRepository.save(documentType);
  }

  async deleteDocumentType(id: string): Promise<boolean> {
    const result = await this.documentTypeRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // BulkFile CRUD operations
  async createBulkFile(data: {
    originalFileName: string;
    rawFileUrl: string;
    documentTypeId: string;
    cleanFileUrl?: string;
    ingestionSummary?: { recordCount?: number; errors?: string[] };
  }): Promise<BulkFile> {
    const documentType = await this.documentTypeRepository.findOne({
      where: { id: data.documentTypeId }
    });
    
    if (!documentType) {
      throw new Error('Document type not found');
    }

    const bulkFile = this.bulkFileRepository.create({
      originalFileName: data.originalFileName,
      rawFileUrl: data.rawFileUrl,
      cleanFileUrl: data.cleanFileUrl,
      ingestionSummary: data.ingestionSummary,
      documentType,
    });

    return await this.bulkFileRepository.save(bulkFile);
  }

  async getAllBulkFiles(): Promise<BulkFile[]> {
    return await this.bulkFileRepository.find({
      relations: ['documentType', 'validationRuns'],
    });
  }

  async getBulkFileById(id: string): Promise<BulkFile | null> {
    return await this.bulkFileRepository.findOne({
      where: { id },
      relations: ['documentType', 'validationRuns'],
    });
  }

  async getBulkFilesByDocumentType(documentTypeId: string): Promise<BulkFile[]> {
    return await this.bulkFileRepository.find({
      where: { documentType: { id: documentTypeId } },
      relations: ['documentType', 'validationRuns'],
    });
  }

  async updateBulkFile(id: string, updateData: {
    ingestionStatus?: IngestionStatus;
    cleanFileUrl?: string;
    ingestionSummary?: { recordCount?: number; errors?: string[] };
    ingestionCompletedAt?: Date;
  }): Promise<BulkFile | null> {
    const bulkFile = await this.bulkFileRepository.findOne({ where: { id } });
    if (!bulkFile) {
      return null;
    }

    Object.assign(bulkFile, updateData);
    return await this.bulkFileRepository.save(bulkFile);
  }

  async deleteBulkFile(id: string): Promise<boolean> {
    const result = await this.bulkFileRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async updateIngestionStatus(id: string, status: IngestionStatus, summary?: { recordCount?: number; errors?: string[] }): Promise<BulkFile | null> {
    const bulkFile = await this.bulkFileRepository.findOne({ where: { id } });
    if (!bulkFile) {
      return null;
    }

    bulkFile.ingestionStatus = status;
    if (summary) {
      bulkFile.ingestionSummary = summary;
    }
    if (status === IngestionStatus.COMPLETED || status === IngestionStatus.FAILED) {
      bulkFile.ingestionCompletedAt = new Date();
    }

    return await this.bulkFileRepository.save(bulkFile);
  }
}
