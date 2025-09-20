import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { DocumentService } from '../services/DocumentService';
import { RuleService } from '../services/RuleService';
import { ValidationService } from '../services/ValidationService';
import { UserRole } from '../entities/User';
import { IngestionStatus } from '../entities/BulkFile';
import { RuleType } from '../entities/Rule';
import { RunStatus, ValidationState } from '../entities/ValidationRun';

const router = Router();

// Utility function to safely extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Initialize services
const userService = new UserService();
const documentService = new DocumentService();
const ruleService = new RuleService();
const validationService = new ValidationService();

// =============================================================================
// USER ROUTES
// =============================================================================

// Create user
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await userService.createUser({ email, password, role });
    
    // Remove password hash from response
    const { passwordHash, ...userResponse } = user;
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Get all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get user by ID
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Update user
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    const user = await userService.updateUser(req.params.id, { email, password, role });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash, ...userResponse } = user;
    res.json(userResponse);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Delete user
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// =============================================================================
// DOCUMENT TYPE ROUTES
// =============================================================================

// Create document type
/**
 * @openapi
 * /api/document-types:
 *   post:
 *     summary: Create a document type (starts in DRAFT)
 *     tags: [Document Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               ingestionConfig:
 *                 type: object
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 */
router.post('/document-types', async (req: Request, res: Response) => {
  try {
    const { name, description, ingestionConfig } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const documentType = await documentService.createDocumentType({
      name,
      description,
      ingestionConfig,
    });
    
    res.status(201).json(documentType);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Get all document types
/**
 * @openapi
 * /api/document-types:
 *   get:
 *     summary: List all document types
 *     tags: [Document Types]
 *     responses:
 *       200:
 *         description: Array of document types
 *       500:
 *         description: Server error
 */
router.get('/document-types', async (req: Request, res: Response) => {
  try {
    const documentTypes = await documentService.getAllDocumentTypes();
    res.json(documentTypes);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get document type by ID
router.get('/document-types/:id', async (req: Request, res: Response) => {
  try {
    const documentType = await documentService.getDocumentTypeById(req.params.id);
    if (!documentType) {
      return res.status(404).json({ error: 'Document type not found' });
    }
    res.json(documentType);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Update document type
/**
 * @openapi
 * /api/document-types/{id}:
 *   put:
 *     summary: Update a document type (fails if COMPLETED)
 *     tags: [Document Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               ingestionConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 */
router.put('/document-types/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, ingestionConfig } = req.body;
    const documentType = await documentService.updateDocumentType(req.params.id, {
      name,
      description,
      ingestionConfig,
    });
    
    if (!documentType) {
      return res.status(404).json({ error: 'Document type not found' });
    }
    
    res.json(documentType);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Complete document type (transition from DRAFT to COMPLETED)
/**
 * @openapi
 * /api/document-types/{id}/complete:
 *   patch:
 *     summary: Complete a document type (becomes immutable and usable for ingestion)
 *     tags: [Document Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Completed
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 */
router.patch('/document-types/:id/complete', async (req: Request, res: Response) => {
  try {
    const documentType = await documentService.completeDocumentType(req.params.id);
    if (!documentType) {
      return res.status(404).json({ error: 'Document type not found' });
    }
    res.json(documentType);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Delete document type
router.delete('/document-types/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await documentService.deleteDocumentType(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Document type not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// =============================================================================
// BULK FILE ROUTES
// =============================================================================

// Create bulk file
/**
 * @openapi
 * /api/bulk-files:
 *   post:
 *     summary: Create a bulk file record (requires COMPLETED document type)
 *     tags: [Bulk Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [originalFileName, rawFileUrl, documentTypeId]
 *             properties:
 *               originalFileName:
 *                 type: string
 *               rawFileUrl:
 *                 type: string
 *               documentTypeId:
 *                 type: string
 *               cleanFileUrl:
 *                 type: string
 *               ingestionSummary:
 *                 type: object
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 */
router.post('/bulk-files', async (req: Request, res: Response) => {
  try {
    const { originalFileName, rawFileUrl, documentTypeId, cleanFileUrl, ingestionSummary } = req.body;
    
    if (!originalFileName || !rawFileUrl || !documentTypeId) {
      return res.status(400).json({ 
        error: 'originalFileName, rawFileUrl, and documentTypeId are required' 
      });
    }

    const bulkFile = await documentService.createBulkFile({
      originalFileName,
      rawFileUrl,
      documentTypeId,
      cleanFileUrl,
      ingestionSummary,
    });
    
    res.status(201).json(bulkFile);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Get all bulk files
router.get('/bulk-files', async (req: Request, res: Response) => {
  try {
    const bulkFiles = await documentService.getAllBulkFiles();
    res.json(bulkFiles);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get bulk file by ID
router.get('/bulk-files/:id', async (req: Request, res: Response) => {
  try {
    const bulkFile = await documentService.getBulkFileById(req.params.id);
    if (!bulkFile) {
      return res.status(404).json({ error: 'Bulk file not found' });
    }
    res.json(bulkFile);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get bulk files by document type
router.get('/document-types/:documentTypeId/bulk-files', async (req: Request, res: Response) => {
  try {
    const bulkFiles = await documentService.getBulkFilesByDocumentType(req.params.documentTypeId);
    res.json(bulkFiles);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Update bulk file
router.put('/bulk-files/:id', async (req: Request, res: Response) => {
  try {
    const { ingestionStatus, cleanFileUrl, ingestionSummary, ingestionCompletedAt } = req.body;
    const bulkFile = await documentService.updateBulkFile(req.params.id, {
      ingestionStatus,
      cleanFileUrl,
      ingestionSummary,
      ingestionCompletedAt,
    });
    
    if (!bulkFile) {
      return res.status(404).json({ error: 'Bulk file not found' });
    }
    
    res.json(bulkFile);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Update ingestion status
router.patch('/bulk-files/:id/ingestion-status', async (req: Request, res: Response) => {
  try {
    const { status, summary } = req.body;
    
    if (!status || !Object.values(IngestionStatus).includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const bulkFile = await documentService.updateIngestionStatus(req.params.id, status, summary);
    
    if (!bulkFile) {
      return res.status(404).json({ error: 'Bulk file not found' });
    }
    
    res.json(bulkFile);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Delete bulk file
router.delete('/bulk-files/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await documentService.deleteBulkFile(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Bulk file not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// =============================================================================
// RULE ROUTES
// =============================================================================

// Create rule
router.post('/rules', async (req: Request, res: Response) => {
  try {
    const { fieldName, type, ruleContent, metadata } = req.body;
    
    if (!fieldName || !type || !ruleContent) {
      return res.status(400).json({ 
        error: 'fieldName, type, and ruleContent are required' 
      });
    }

    if (!Object.values(RuleType).includes(type)) {
      return res.status(400).json({ error: 'Invalid rule type' });
    }

    const rule = await ruleService.createRule({
      fieldName,
      type,
      ruleContent,
      metadata,
    });
    
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Get all rules
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const { type, fieldName } = req.query;
    
    let rules;
    if (type) {
      rules = await ruleService.getRulesByType(type as RuleType);
    } else if (fieldName) {
      rules = await ruleService.getRulesByFieldName(fieldName as string);
    } else {
      rules = await ruleService.getAllRules();
    }
    
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get rule by ID
router.get('/rules/:id', async (req: Request, res: Response) => {
  try {
    const rule = await ruleService.getRuleById(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Update rule
router.put('/rules/:id', async (req: Request, res: Response) => {
  try {
    const { fieldName, type, ruleContent, metadata } = req.body;
    
    if (type && !Object.values(RuleType).includes(type)) {
      return res.status(400).json({ error: 'Invalid rule type' });
    }

    const rule = await ruleService.updateRule(req.params.id, {
      fieldName,
      type,
      ruleContent,
      metadata,
    });
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Delete rule
router.delete('/rules/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await ruleService.deleteRule(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// =============================================================================
// RULE SET ROUTES
// =============================================================================

// Create rule set
router.post('/rule-sets', async (req: Request, res: Response) => {
  try {
    const { documentTypeId, version, description, ruleIds } = req.body;
    
    if (!documentTypeId || version === undefined) {
      return res.status(400).json({ 
        error: 'documentTypeId and version are required' 
      });
    }

    const ruleSet = await ruleService.createRuleSet({
      documentTypeId,
      version,
      description,
      ruleIds,
    });
    
    res.status(201).json(ruleSet);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Get all rule sets
router.get('/rule-sets', async (req: Request, res: Response) => {
  try {
    const ruleSets = await ruleService.getAllRuleSets();
    res.json(ruleSets);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get rule set by ID
router.get('/rule-sets/:id', async (req: Request, res: Response) => {
  try {
    const ruleSet = await ruleService.getRuleSetById(req.params.id);
    if (!ruleSet) {
      return res.status(404).json({ error: 'Rule set not found' });
    }
    res.json(ruleSet);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get rule sets by document type
router.get('/document-types/:documentTypeId/rule-sets', async (req: Request, res: Response) => {
  try {
    const ruleSets = await ruleService.getRuleSetsByDocumentType(req.params.documentTypeId);
    res.json(ruleSets);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get latest rule set by document type
router.get('/document-types/:documentTypeId/rule-sets/latest', async (req: Request, res: Response) => {
  try {
    const ruleSet = await ruleService.getLatestRuleSetByDocumentType(req.params.documentTypeId);
    if (!ruleSet) {
      return res.status(404).json({ error: 'No rule sets found for this document type' });
    }
    res.json(ruleSet);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Update rule set
router.put('/rule-sets/:id', async (req: Request, res: Response) => {
  try {
    const { description, ruleIds } = req.body;
    const ruleSet = await ruleService.updateRuleSet(req.params.id, {
      description,
      ruleIds,
    });
    
    if (!ruleSet) {
      return res.status(404).json({ error: 'Rule set not found' });
    }
    
    res.json(ruleSet);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Add rules to rule set
router.post('/rule-sets/:id/rules', async (req: Request, res: Response) => {
  try {
    const { ruleIds } = req.body;
    
    if (!ruleIds || !Array.isArray(ruleIds)) {
      return res.status(400).json({ error: 'ruleIds array is required' });
    }

    const ruleSet = await ruleService.addRulesToRuleSet(req.params.id, ruleIds);
    
    if (!ruleSet) {
      return res.status(404).json({ error: 'Rule set not found' });
    }
    
    res.json(ruleSet);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Remove rules from rule set
router.delete('/rule-sets/:id/rules', async (req: Request, res: Response) => {
  try {
    const { ruleIds } = req.body;
    
    if (!ruleIds || !Array.isArray(ruleIds)) {
      return res.status(400).json({ error: 'ruleIds array is required' });
    }

    const ruleSet = await ruleService.removeRulesFromRuleSet(req.params.id, ruleIds);
    
    if (!ruleSet) {
      return res.status(404).json({ error: 'Rule set not found' });
    }
    
    res.json(ruleSet);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Delete rule set
router.delete('/rule-sets/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await ruleService.deleteRuleSet(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Rule set not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// =============================================================================
// VALIDATION RUN ROUTES
// =============================================================================

// Create validation run
/**
 * @openapi
 * /api/validation-runs:
 *   post:
 *     summary: Create a validation run
 *     tags: [Validation Runs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, bulkFileId, ruleSetId]
 *             properties:
 *               userId:
 *                 type: string
 *               bulkFileId:
 *                 type: string
 *               ruleSetId:
 *                 type: string
 *               state:
 *                 type: string
 *                 enum: [draft, accepted]
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 */
router.post('/validation-runs', async (req: Request, res: Response) => {
  try {
    const { userId, bulkFileId, ruleSetId, state } = req.body;
    
    if (!userId || !bulkFileId || !ruleSetId) {
      return res.status(400).json({ 
        error: 'userId, bulkFileId, and ruleSetId are required' 
      });
    }

    const validationRun = await validationService.createValidationRun({
      userId,
      bulkFileId,
      ruleSetId,
      state,
    });
    
    res.status(201).json(validationRun);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Get all validation runs
router.get('/validation-runs', async (req: Request, res: Response) => {
  try {
    const { status, state, userId, bulkFileId } = req.query;
    
    let validationRuns;
    if (status) {
      validationRuns = await validationService.getValidationRunsByStatus(status as RunStatus);
    } else if (state) {
      validationRuns = await validationService.getValidationRunsByState(state as ValidationState);
    } else if (userId) {
      validationRuns = await validationService.getValidationRunsByUser(userId as string);
    } else if (bulkFileId) {
      validationRuns = await validationService.getValidationRunsByBulkFile(bulkFileId as string);
    } else {
      validationRuns = await validationService.getAllValidationRuns();
    }
    
    res.json(validationRuns);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get validation run by ID
router.get('/validation-runs/:id', async (req: Request, res: Response) => {
  try {
    const validationRun = await validationService.getValidationRunById(req.params.id);
    if (!validationRun) {
      return res.status(404).json({ error: 'Validation run not found' });
    }
    res.json(validationRun);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Update validation run status
router.patch('/validation-runs/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, summary, recordSummaryReportUrl, fieldDetailReportUrl } = req.body;
    
    if (!status || !Object.values(RunStatus).includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const validationRun = await validationService.updateValidationRunStatus(
      req.params.id,
      status,
      summary,
      { recordSummaryReportUrl, fieldDetailReportUrl }
    );
    
    if (!validationRun) {
      return res.status(404).json({ error: 'Validation run not found' });
    }
    
    res.json(validationRun);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Update validation run state
router.patch('/validation-runs/:id/state', async (req: Request, res: Response) => {
  try {
    const { state } = req.body;
    
    if (!state || !Object.values(ValidationState).includes(state)) {
      return res.status(400).json({ error: 'Valid state is required' });
    }

    const validationRun = await validationService.updateValidationRunState(req.params.id, state);
    
    if (!validationRun) {
      return res.status(404).json({ error: 'Validation run not found' });
    }
    
    res.json(validationRun);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Accept validation run (promote from draft to accepted)
router.post('/validation-runs/:id/accept', async (req: Request, res: Response) => {
  try {
    const validationRun = await validationService.acceptValidationRun(req.params.id);
    
    if (!validationRun) {
      return res.status(404).json({ error: 'Validation run not found' });
    }
    
    res.json(validationRun);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Delete validation run
router.delete('/validation-runs/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await validationService.deleteValidationRun(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Validation run not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get validation run statistics
router.get('/validation-runs/stats', async (req: Request, res: Response) => {
  try {
    const stats = await validationService.getValidationRunStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get draft runs for cleanup
router.get('/validation-runs/cleanup/drafts', async (req: Request, res: Response) => {
  try {
    const daysOld = parseInt(req.query.daysOld as string) || 30;
    const draftRuns = await validationService.getDraftRunsForCleanup(daysOld);
    res.json(draftRuns);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
