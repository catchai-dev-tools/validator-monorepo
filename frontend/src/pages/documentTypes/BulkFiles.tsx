import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useParams } from "react-router-dom";
import { api } from "@/api/client";

interface BulkFileRow {
  id: string;
  originalFileName: string;
  ingestionStatus: string;
  rawFileUrl: string;
  cleanFileUrl?: string;
  uploadedAt: string;
  ingestionCompletedAt?: string;
}

const DocBulkFiles: React.FC = () => {
  const { id } = useParams();
  const [rows, setRows] = useState<BulkFileRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get<BulkFileRow[]>(`/api/document-types/${id}/bulk-files`);
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [id]);

  const columns: GridColDef<BulkFileRow>[] = useMemo(
    () => [
      { field: "originalFileName", headerName: "File", flex: 1, minWidth: 200 },
      { field: "ingestionStatus", headerName: "Ingestion", width: 140 },
      { field: "rawFileUrl", headerName: "Raw URL", flex: 1, minWidth: 240 },
      { field: "cleanFileUrl", headerName: "Clean URL", flex: 1, minWidth: 240 },
      { field: "uploadedAt", headerName: "Uploaded", width: 180, valueGetter: (p: any) => new Date(p.row.uploadedAt).toLocaleString() },
    ],
    []
  );

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Bulk Files</Typography>
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

export default DocBulkFiles;
