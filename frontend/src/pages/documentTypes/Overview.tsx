import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { api } from "@/api/client";

interface DocumentType {
  id: string;
  name: string;
  description?: string;
  status: string;
  ingestionConfig?: any;
}

interface RuleSet { id: string; version: number; description?: string }
interface BulkFile { id: string }

const DocOverview: React.FC = () => {
  const { id } = useParams();
  const [docType, setDocType] = useState<DocumentType | null>(null);
  const [ruleSetCount, setRuleSetCount] = useState<number>(0);
  const [bulkFileCount, setBulkFileCount] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/document-types/${id}`).then((r) => setDocType(r.data));
    api.get<RuleSet[]>(`/api/document-types/${id}/rule-sets`).then((r) => setRuleSetCount(r.data.length));
    api.get<BulkFile[]>(`/api/document-types/${id}/bulk-files`).then((r) => setBulkFileCount(r.data.length));
  }, [id]);

  if (!id) return null;

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        {docType ? `${docType.name} — Overview` : "Loading..."}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Typography variant="h5">{docType?.status || "-"}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Rule Sets</Typography>
              <Typography variant="h5">{ruleSetCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Bulk Files</Typography>
              <Typography variant="h5">{bulkFileCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={3}>
        <Typography variant="subtitle1" gutterBottom>Description</Typography>
        <Typography variant="body2">{docType?.description || "No description."}</Typography>
      </Box>

      {docType?.ingestionConfig && (
        <Box mt={3}>
          <Typography variant="subtitle1" gutterBottom>Ingestion Config</Typography>
          <pre style={{ background: "#f6f8fa", padding: 12, borderRadius: 8, overflow: "auto" }}>
            {JSON.stringify(docType.ingestionConfig, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
};

export default DocOverview;
