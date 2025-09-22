import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { api } from "@/api/client";

interface BulkFileRow {
  id: string;
  originalFileName: string;
  ingestionStatus: string;
  rawFileUrl: string;
  cleanFileUrl?: string;
  uploadedAt: string;
  ingestionCompletedAt?: string;
  documentType: { id: string; name: string };
}

const BulkFilesList: React.FC = () => {
  const [rows, setRows] = useState<BulkFileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<BulkFileRow> | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<BulkFileRow[]>("/api/bulk-files");
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const columns: GridColDef<BulkFileRow>[] = useMemo(
    () => [
      { field: "originalFileName", headerName: "File", flex: 1, minWidth: 200 },
      { field: "ingestionStatus", headerName: "Ingestion", width: 140 },
      { field: "rawFileUrl", headerName: "Raw URL", flex: 1, minWidth: 240 },
      { field: "cleanFileUrl", headerName: "Clean URL", flex: 1, minWidth: 240 },
      { field: "documentType", headerName: "Doc Type", width: 180, valueGetter: (p: any) => p.row.documentType?.name ?? "" },
      { field: "uploadedAt", headerName: "Uploaded", width: 180, valueGetter: (p: any) => new Date(p.row.uploadedAt).toLocaleString() },
    ],
    []
  );

  const handleOpen = () => {
    setCurrent({ originalFileName: "", rawFileUrl: "", cleanFileUrl: "" });
    setOpen(true);
  };
  const handleClose = () => { setOpen(false); setCurrent(null); };

  const handleSave = async () => {
    if (!current) return;
    if (!current.originalFileName || !current.rawFileUrl || !(current as any).documentTypeId) return;
    await api.post(`/api/bulk-files`, {
      originalFileName: current.originalFileName,
      rawFileUrl: current.rawFileUrl,
      cleanFileUrl: current.cleanFileUrl,
      documentTypeId: (current as any).documentTypeId,
    });
    handleClose();
    fetchItems();
  };

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Bulk Files</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={fetchItems}>Refresh</Button>
          <Button variant="contained" onClick={handleOpen}>New</Button>
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

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>New Bulk File</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Document Type ID" fullWidth value={(current as any)?.documentTypeId || ""} onChange={(e) => setCurrent({ ...current!, documentTypeId: e.target.value } as any)} />
            <TextField label="Original File Name" fullWidth value={current?.originalFileName || ""} onChange={(e) => setCurrent({ ...current!, originalFileName: e.target.value })} />
            <TextField label="Raw File URL" fullWidth value={current?.rawFileUrl || ""} onChange={(e) => setCurrent({ ...current!, rawFileUrl: e.target.value })} />
            <TextField label="Clean File URL" fullWidth value={current?.cleanFileUrl || ""} onChange={(e) => setCurrent({ ...current!, cleanFileUrl: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkFilesList;
