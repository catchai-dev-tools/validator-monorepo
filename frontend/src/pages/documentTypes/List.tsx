import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { api } from "@/api/client";

interface DocumentTypeRow {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
}

const DocumentTypesList: React.FC = () => {
  const [rows, setRows] = useState<DocumentTypeRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<DocumentTypeRow[]>("/api/document-types");
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const columns: GridColDef<DocumentTypeRow>[] = useMemo(
    () => [
      { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
      { field: "description", headerName: "Description", flex: 1, minWidth: 220 },
      { field: "status", headerName: "Status", width: 140 },
      { field: "createdAt", headerName: "Created", flex: 1, minWidth: 180, valueGetter: (p) => new Date(p.value as string).toLocaleString() },
    ],
    []
  );

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Document Types</Typography>
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

export default DocumentTypesList;
