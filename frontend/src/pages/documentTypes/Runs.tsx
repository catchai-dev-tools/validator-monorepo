import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useParams } from "react-router-dom";
import { api } from "@/api/client";

interface ValidationRunRow {
  id: string;
  state: string;
  status: string;
  submittedAt: string;
  completedAt?: string;
  user?: { id: string; email: string };
  bulkFile?: { id: string; originalFileName: string; documentType?: { id: string; name: string } };
  ruleSet?: { id: string; version: number };
}

const DocRuns: React.FC = () => {
  const { id } = useParams();
  const [rows, setRows] = useState<ValidationRunRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ValidationRunRow[]>(`/api/validation-runs`);
      // Client-side filter by document type
      const filtered = (data || []).filter((r) => r.bulkFile?.documentType?.id === id);
      setRows(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [id]);

  const columns: GridColDef<ValidationRunRow>[] = useMemo(
    () => [
      { field: "status", headerName: "Status", width: 140, renderCell: (p) => <Chip size="small" label={String(p.value)} /> },
      { field: "state", headerName: "State", width: 120 },
      { field: "bulkFile", headerName: "Bulk File", flex: 1, minWidth: 220, valueGetter: (p: any) => p.row.bulkFile?.originalFileName || "" },
      { field: "ruleSet", headerName: "Rule Set", width: 140, valueGetter: (p: any) => (p.row.ruleSet ? `v${p.row.ruleSet.version}` : "") },
      { field: "submittedAt", headerName: "Submitted", width: 180, valueGetter: (p: any) => new Date(p.value as string).toLocaleString() },
      { field: "completedAt", headerName: "Completed", width: 180, valueGetter: (p: any) => (p.value ? new Date(p.value as string).toLocaleString() : "-") },
    ],
    []
  );

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Validation Runs</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={fetchItems}>Refresh</Button>
        </Stack>
      </Stack>
      <div style={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </Box>
  );
};

export default DocRuns;
