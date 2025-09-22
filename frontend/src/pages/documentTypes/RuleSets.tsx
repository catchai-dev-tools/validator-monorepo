import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useParams } from "react-router-dom";
import { api } from "@/api/client";

interface RuleSetRow {
  id: string;
  version: number;
  description?: string;
  createdAt: string;
}

const DocRuleSets: React.FC = () => {
  const { id } = useParams();
  const [rows, setRows] = useState<RuleSetRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get<RuleSetRow[]>(`/api/document-types/${id}/rule-sets`);
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [id]);

  const columns: GridColDef<RuleSetRow>[] = useMemo(
    () => [
      { field: "version", headerName: "Version", width: 120 },
      { field: "description", headerName: "Description", flex: 1, minWidth: 240 },
      { field: "createdAt", headerName: "Created", width: 180, valueGetter: (p: any) => new Date(p.value as string).toLocaleString() },
    ],
    []
  );

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Rule Sets</Typography>
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

export default DocRuleSets;
