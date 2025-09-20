import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentTypeStatus1758401124483 implements MigrationInterface {
    name = 'AddDocumentTypeStatus1758401124483'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ValidationRuns_state_enum" AS ENUM('draft', 'accepted')`);
        await queryRunner.query(`CREATE TYPE "public"."ValidationRuns_status_enum" AS ENUM('pending', 'running', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "ValidationRuns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "state" "public"."ValidationRuns_state_enum" NOT NULL DEFAULT 'draft', "status" "public"."ValidationRuns_status_enum" NOT NULL DEFAULT 'pending', "summary" jsonb, "record_summary_report_url" text, "field_detail_report_url" text, "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completed_at" TIMESTAMP WITH TIME ZONE, "userId" uuid NOT NULL, "bulkFileId" uuid NOT NULL, "ruleSetId" uuid NOT NULL, CONSTRAINT "PK_c779c640004c03ff4614c56d2d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_89c32afe770c12c7b1e98b9b77" ON "ValidationRuns" ("state") `);
        await queryRunner.query(`CREATE INDEX "IDX_dcb7b3a80601d904ebf73907dd" ON "ValidationRuns" ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."Users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "Users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "password_hash" text NOT NULL, "role" "public"."Users_role_enum" NOT NULL DEFAULT 'user', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_3c3ab3f49a87e6ddb607f3c4945" UNIQUE ("email"), CONSTRAINT "PK_16d4f7d636df336db11d87413e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Rules_type_enum" AS ENUM('intra_field', 'intra_record', 'intra_bulk', 'cross_bulk_set', 'cross_bulk_single', 'dictionary', 'external_api')`);
        await queryRunner.query(`CREATE TABLE "Rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "field_name" text NOT NULL, "type" "public"."Rules_type_enum" NOT NULL, "metadata" jsonb, "rule_content_hash" text NOT NULL, "rule_content" text NOT NULL, CONSTRAINT "UQ_404af022a261d224b2d4465c088" UNIQUE ("rule_content_hash"), CONSTRAINT "PK_6b3823a21cc6c08840ab175f02c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "RuleSets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" integer NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "documentTypeId" uuid NOT NULL, CONSTRAINT "UQ_325e6278a78773a5424a70ae6fa" UNIQUE ("documentTypeId", "version"), CONSTRAINT "PK_a90374b5ca6c7cebbe7fda9d2a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."DocumentTypes_status_enum" AS ENUM('draft', 'completed')`);
        await queryRunner.query(`CREATE TABLE "DocumentTypes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text, "ingestion_config" jsonb, "status" "public"."DocumentTypes_status_enum" NOT NULL DEFAULT 'draft', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_323745cc2c180cf10106b87ca10" UNIQUE ("name"), CONSTRAINT "PK_14988fb44e6e6a3b5b582ad9479" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."BulkFiles_ingestionstatus_enum" AS ENUM('pending', 'running', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "BulkFiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "original_file_name" text NOT NULL, "ingestionStatus" "public"."BulkFiles_ingestionstatus_enum" NOT NULL DEFAULT 'pending', "raw_file_url" text NOT NULL, "clean_file_url" text, "ingestion_summary" jsonb, "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ingestion_completed_at" TIMESTAMP WITH TIME ZONE, "documentTypeId" uuid NOT NULL, CONSTRAINT "PK_04d0ef2ba19cfef86f04d41eb9b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "RuleSet_Rules" ("rule_set_id" uuid NOT NULL, "rule_id" uuid NOT NULL, CONSTRAINT "PK_58ff1c65615c5a8036e080c8717" PRIMARY KEY ("rule_set_id", "rule_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6ca6a29a042766c303c0634ceb" ON "RuleSet_Rules" ("rule_set_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1dea32a132e5f00c35351aa903" ON "RuleSet_Rules" ("rule_id") `);
        await queryRunner.query(`ALTER TABLE "ValidationRuns" ADD CONSTRAINT "FK_c3bce43b498cbade4ae39982f63" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ValidationRuns" ADD CONSTRAINT "FK_8928bea7d19ea77b62b5f77e727" FOREIGN KEY ("bulkFileId") REFERENCES "BulkFiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ValidationRuns" ADD CONSTRAINT "FK_292e1a5604968565130d6c47ec2" FOREIGN KEY ("ruleSetId") REFERENCES "RuleSets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "RuleSets" ADD CONSTRAINT "FK_efe9752fe5bf063f24f17cc0b5f" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentTypes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "BulkFiles" ADD CONSTRAINT "FK_4e9c82f9ef673df3159d0325ef9" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentTypes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "RuleSet_Rules" ADD CONSTRAINT "FK_6ca6a29a042766c303c0634ceb9" FOREIGN KEY ("rule_set_id") REFERENCES "RuleSets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "RuleSet_Rules" ADD CONSTRAINT "FK_1dea32a132e5f00c35351aa9038" FOREIGN KEY ("rule_id") REFERENCES "Rules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "RuleSet_Rules" DROP CONSTRAINT "FK_1dea32a132e5f00c35351aa9038"`);
        await queryRunner.query(`ALTER TABLE "RuleSet_Rules" DROP CONSTRAINT "FK_6ca6a29a042766c303c0634ceb9"`);
        await queryRunner.query(`ALTER TABLE "BulkFiles" DROP CONSTRAINT "FK_4e9c82f9ef673df3159d0325ef9"`);
        await queryRunner.query(`ALTER TABLE "RuleSets" DROP CONSTRAINT "FK_efe9752fe5bf063f24f17cc0b5f"`);
        await queryRunner.query(`ALTER TABLE "ValidationRuns" DROP CONSTRAINT "FK_292e1a5604968565130d6c47ec2"`);
        await queryRunner.query(`ALTER TABLE "ValidationRuns" DROP CONSTRAINT "FK_8928bea7d19ea77b62b5f77e727"`);
        await queryRunner.query(`ALTER TABLE "ValidationRuns" DROP CONSTRAINT "FK_c3bce43b498cbade4ae39982f63"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1dea32a132e5f00c35351aa903"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6ca6a29a042766c303c0634ceb"`);
        await queryRunner.query(`DROP TABLE "RuleSet_Rules"`);
        await queryRunner.query(`DROP TABLE "BulkFiles"`);
        await queryRunner.query(`DROP TYPE "public"."BulkFiles_ingestionstatus_enum"`);
        await queryRunner.query(`DROP TABLE "DocumentTypes"`);
        await queryRunner.query(`DROP TYPE "public"."DocumentTypes_status_enum"`);
        await queryRunner.query(`DROP TABLE "RuleSets"`);
        await queryRunner.query(`DROP TABLE "Rules"`);
        await queryRunner.query(`DROP TYPE "public"."Rules_type_enum"`);
        await queryRunner.query(`DROP TABLE "Users"`);
        await queryRunner.query(`DROP TYPE "public"."Users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dcb7b3a80601d904ebf73907dd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89c32afe770c12c7b1e98b9b77"`);
        await queryRunner.query(`DROP TABLE "ValidationRuns"`);
        await queryRunner.query(`DROP TYPE "public"."ValidationRuns_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ValidationRuns_state_enum"`);
    }

}
