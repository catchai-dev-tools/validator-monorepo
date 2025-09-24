import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { DocumentType, DocumentTypeStatus } from '../entities/DocumentType';
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
    // Validate ingestionConfig presence and shape
    this.validateIngestionConfigOrThrow(data.ingestionConfig);
    const documentType = this.documentTypeRepository.create({
      ...data,
      status: DocumentTypeStatus.DRAFT,
    });
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

    // Freeze ingestionConfig once any bulk files exist for this document type
    if (typeof updateData.ingestionConfig !== 'undefined') {
      // Validate new ingestion config before applying
      this.validateIngestionConfigOrThrow(updateData.ingestionConfig);
      const hasBulkFiles = await this.bulkFileRepository.count({ where: { documentType: { id } } });
      if (hasBulkFiles > 0) {
        throw new Error('ingestionConfig cannot be modified after data has been ingested');
      }
      // Assign ingestion config when allowed
      (documentType as any).ingestionConfig = updateData.ingestionConfig as object;
    }

    // Name and description remain editable regardless of status
    if (typeof updateData.name !== 'undefined') {
      documentType.name = updateData.name as string;
    }
    if (typeof updateData.description !== 'undefined') {
      documentType.description = updateData.description as string;
    }

    return await this.documentTypeRepository.save(documentType);
  }

  async completeDocumentType(id: string): Promise<DocumentType | null> {
    const documentType = await this.documentTypeRepository.findOne({ where: { id } });
    if (!documentType) {
      return null;
    }
    if (documentType.status === DocumentTypeStatus.COMPLETED) {
      return documentType; // already completed
    }
    documentType.status = DocumentTypeStatus.COMPLETED;
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

    if (documentType.status !== DocumentTypeStatus.COMPLETED) {
      throw new Error('Document type must be COMPLETED to ingest bulk files');
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

  // ---------------------------------------------------------------------------
  // Validation helpers
  // ---------------------------------------------------------------------------
  private validateIngestionConfigOrThrow(cfg: any) {
    if (!cfg || typeof cfg !== 'object') {
      throw new Error('ingestionConfig is required');
    }
    const { format, lineLength, fields } = cfg as any;
    if (format !== 'fixed-width') {
      throw new Error('ingestionConfig.format must be "fixed-width"');
    }
    const ll = Number(lineLength);
    if (!Number.isInteger(ll) || ll <= 0) {
      throw new Error('ingestionConfig.lineLength must be a positive integer');
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('ingestionConfig.fields must be a non-empty array');
    }
    const allowedTypes = new Set(['str', 'int', 'float']);
    let sum = 0;
    for (const f of fields) {
      if (!f || typeof f !== 'object') {
        throw new Error('ingestionConfig.fields items must be objects');
      }
      if (!f.name || typeof f.name !== 'string') {
        throw new Error('Each field must have a name');
      }
      if (!allowedTypes.has(f.type)) {
        throw new Error('Each field.type must be one of str, int, float');
      }
      const len = Number(f.length);
      if (!Number.isInteger(len) || len <= 0) {
        throw new Error('Each field.length must be a positive integer');
      }
      sum += len;
    }
    if (sum !== ll) {
      throw new Error('Sum of field lengths must equal ingestionConfig.lineLength');
    }
  }
}
