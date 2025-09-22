# Data Validation API

A comprehensive Node.js API built with TypeORM for managing a multi-stage data validation platform. This system handles file ingestion, versioned rule application, and detailed multi-level reporting.

> Documentation layout: This file focuses on backend/API usage. For cross-cutting topics (database creation/reset, environment), see the repository root `README.md`.

## 🏗️ Architecture Overview

The platform follows a multi-stage workflow:

1. **UPLOAD**: Raw fixed-width bulk data files are uploaded and tracked
2. **INGESTION**: Background processes parse raw files into clean, structured data
3. **VALIDATION**: Users create validation runs linking files, rules, and rulesets
4. **EXECUTION & REPORTING**: Three-tier reporting system (summary, record-level, field-level)
5. **ACCEPTANCE**: Draft runs can be promoted to accepted state for permanent records

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Yarn package manager

### Installation

1. **Clone and install dependencies:**
```bash
yarn install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Set up PostgreSQL database:**
```sql
CREATE DATABASE validation_db;
```

4. **Build and start the application:**
```bash
# Development mode with hot reload
yarn dev

# Production build and start
yarn build
yarn start
```

The API will be available at `http://localhost:3000`

## 📊 Database Schema

### Core Entities

- **Users**: User accounts with roles (user/admin)
- **DocumentTypes**: Categories of data files (e.g., "PensionElderly")
- **BulkFiles**: Uploaded files with ingestion tracking
- **Rules**: Individual validation definitions with YAML content
- **RuleSets**: Versioned collections of rules per document type
- **ValidationRuns**: Validation execution records with results

### Key Relationships

- DocumentTypes → RuleSets (one-to-many, versioned)
- DocumentTypes → BulkFiles (one-to-many)
- RuleSets ↔ Rules (many-to-many)
- ValidationRuns → User, BulkFile, RuleSet (many-to-one each)

## 🛠️ API Endpoints

### Users
- `POST /api/users` - Create user
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Document Types
- `POST /api/document-types` - Create document type
- `GET /api/document-types` - List all document types
- `GET /api/document-types/:id` - Get document type by ID
- `PUT /api/document-types/:id` - Update document type
- `PATCH /api/document-types/:id/complete` - Mark document type as completed (immutable and usable for ingestion)
- `DELETE /api/document-types/:id` - Delete document type

### Bulk Files
- `POST /api/bulk-files` - Create bulk file record
- `GET /api/bulk-files` - List all bulk files
- `GET /api/bulk-files/:id` - Get bulk file by ID
- `GET /api/document-types/:documentTypeId/bulk-files` - Get files by document type
- `PUT /api/bulk-files/:id` - Update bulk file
- `PATCH /api/bulk-files/:id/ingestion-status` - Update ingestion status
- `DELETE /api/bulk-files/:id` - Delete bulk file

### Rules
- `POST /api/rules` - Create rule
- `GET /api/rules` - List rules (supports ?type= and ?fieldName= filters)
- `GET /api/rules/:id` - Get rule by ID
- `PUT /api/rules/:id` - Update rule
- `DELETE /api/rules/:id` - Delete rule

### Rule Sets
- `POST /api/rule-sets` - Create rule set
- `GET /api/rule-sets` - List all rule sets
- `GET /api/rule-sets/:id` - Get rule set by ID
- `GET /api/document-types/:documentTypeId/rule-sets` - Get rule sets by document type
- `GET /api/document-types/:documentTypeId/rule-sets/latest` - Get latest rule set version
- `PUT /api/rule-sets/:id` - Update rule set
- `POST /api/rule-sets/:id/rules` - Add rules to rule set
- `DELETE /api/rule-sets/:id/rules` - Remove rules from rule set
- `DELETE /api/rule-sets/:id` - Delete rule set

### Validation Runs
- `POST /api/validation-runs` - Create validation run
- `GET /api/validation-runs` - List runs (supports ?status=, ?state=, ?userId=, ?bulkFileId= filters)
- `GET /api/validation-runs/:id` - Get validation run by ID
- `PATCH /api/validation-runs/:id/status` - Update run status
- `PATCH /api/validation-runs/:id/state` - Update run state
- `POST /api/validation-runs/:id/accept` - Accept draft run (promote to accepted)
- `DELETE /api/validation-runs/:id` - Delete validation run
- `GET /api/validation-runs/stats` - Get validation statistics
- `GET /api/validation-runs/cleanup/drafts` - Get old draft runs for cleanup

### System
- `GET /health` - Health check endpoint

## 🔧 Rule Types

The system supports various rule types for flexible validation:

- `INTRA_FIELD`: Simple field validation (e.g., amount > 0)
- `INTRA_RECORD`: Multi-field validation within same record
- `INTRA_BULK`: Validation across entire file (e.g., uniqueness)
- `CROSS_BULK_SET`: Validation across multiple tagged files
- `CROSS_BULK_SINGLE`: Validation against specific other file
- `DICTIONARY`: Validation against predefined value sets
- `EXTERNAL_API`: Validation requiring external API calls

## 📈 Three-Tier Reporting

### Level 1: Database Summary
High-level aggregates stored in `ValidationRun.summary` JSONB field:
- Total records processed
- Pass/fail/warning counts
- Error breakdowns by rule/field
- Processing duration

### Level 2: Record Summary Report
CSV/JSONL file with per-record summaries:
- Record identifier
- Overall status (pass/fail/warning)
- Error and warning counts
- Failed field names

### Level 3: Field Detail Report
Granular forensic log with every test result:
- Record identifier
- Field name
- Rule name
- Test name
- Status and message

## 🔄 Validation States & Statuses

### Validation States
- `DRAFT`: Temporary run for rule tuning
- `ACCEPTED`: Permanent, official validation record

### Run Statuses
- `PENDING` - Queued for execution
- `RUNNING` - Currently being processed
- `COMPLETED` - Successfully finished
- `FAILED` - Execution failed

### Document Type Statuses
- `DRAFT` - Definition phase; can be edited; cannot be used for ingestion
- `COMPLETED` - Finalized; immutable; required for ingestion

### Ingestion Statuses
- `PENDING`: File uploaded, awaiting processing
- `RUNNING`: Currently being ingested
- `COMPLETED`: Successfully processed
- `FAILED`: Ingestion failed

## 🛡️ Security Features

- Password hashing with bcrypt
- Helmet.js security headers
- CORS configuration
- Input validation and sanitization
- Environment-based configuration

## 🗄️ Database Management

The application uses TypeORM with automatic synchronization in development mode. For production:

1. Set `NODE_ENV=production`
2. Use migrations instead of synchronization
3. Configure proper database credentials
4. Set up connection pooling

## 📝 Example Usage

### Creating a Complete Validation Workflow

1. **Create a document type (starts in DRAFT):**
```bash
curl -X POST http://localhost:3000/api/document-types \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PensionElderly",
    "description": "Elderly pension data files",
    "ingestionConfig": {"delimiter": "|", "encoding": "utf-8"}
  }'
```

2. **Complete the document type (transition DRAFT -> COMPLETED):**
```bash
curl -X PATCH http://localhost:3000/api/document-types/your-document-type-id/complete
```

3. **Upload a bulk file (requires COMPLETED document type):**
```bash
curl -X POST http://localhost:3000/api/bulk-files \
  -H "Content-Type: application/json" \
  -d '{
    "originalFileName": "pension_data_2024.txt",
    "rawFileUrl": "s3://bucket/raw/pension_data_2024.txt",
    "documentTypeId": "your-document-type-id"
  }'
```

4. **Create validation rules:**
```bash
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "fieldName": "amount",
    "type": "intra_field",
    "ruleContent": "amount > 0 and amount < 10000",
    "metadata": {"description": "Amount must be positive and reasonable"}
  }'
```

5. **Create a rule set:**
```bash
curl -X POST http://localhost:3000/api/rule-sets \
  -H "Content-Type: application/json" \
  -d '{
    "documentTypeId": "your-document-type-id",
    "version": 1,
    "description": "Initial validation rules",
    "ruleIds": ["your-rule-id"]
  }'
```

6. **Start a validation run:**
```bash
curl -X POST http://localhost:3000/api/validation-runs \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "bulkFileId": "your-bulk-file-id",
    "ruleSetId": "your-rule-set-id",
    "state": "draft"
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
