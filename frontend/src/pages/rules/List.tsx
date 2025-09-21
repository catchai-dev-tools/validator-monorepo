import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { api } from "@/api/client";
import Editor from "@monaco-editor/react";
import YAML from "yaml";

interface RuleRow {
  id: string;
  fieldName: string;
  type: string;
  ruleContent: string;
}

const RulesList: React.FC = () => {
  const [rows, setRows] = useState<RuleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<RuleRow> | null>(null);

  const fetchItems = async (params?: any) => {
    setLoading(true);
    try {
      const { data } = await api.get<RuleRow[]>("/api/rules", { params });
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const columns: GridColDef<RuleRow>[] = useMemo(
    () => [
      { field: "fieldName", headerName: "Field", flex: 1, minWidth: 160 },
      { field: "type", headerName: "Type", width: 180 },
      { field: "id", headerName: "ID", flex: 1, minWidth: 240 },
    ],
    []
  );

  const handleEdit = (row?: RuleRow) => {
    setCurrent(row || { fieldName: "", type: "intra_field", ruleContent: "" });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrent(null);
  };

  const handleSave = async () => {
    if (!current) return;
    if (current.id) {
      await api.put(`/api/rules/${current.id}`, {
        fieldName: current.fieldName,
        type: current.type,
        ruleContent: current.ruleContent,
      });
    } else {
      await api.post(`/api/rules`, {
        fieldName: current.fieldName,
        type: current.type,
        ruleContent: current.ruleContent,
      });
    }
    handleClose();
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/api/rules/${id}`);
    fetchItems();
  };

  const prettify = () => {
    if (!current?.ruleContent) return;
    try {
      const parsed = YAML.parse(current.ruleContent);
      const pretty = YAML.stringify(parsed);
      setCurrent({ ...current, ruleContent: pretty });
    } catch (e) {
      // ignore parse errors, keep content
    }
  };

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Rules</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => fetchItems()}>Refresh</Button>
          <Button variant="contained" onClick={() => handleEdit()}>New Rule</Button>
        </Stack>
      </Stack>
      <div style={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          onRowDoubleClick={(p) => handleEdit(p.row as RuleRow)}
          initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{current?.id ? "Edit Rule" : "New Rule"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Field Name"
              value={current?.fieldName || ""}
              onChange={(e) => setCurrent({ ...current!, fieldName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Type"
              select
              SelectProps={{ native: true }}
              value={current?.type || "intra_field"}
              onChange={(e) => setCurrent({ ...current!, type: e.target.value })}
              fullWidth
            >
              <option value="intra_field">intra_field</option>
              <option value="intra_record">intra_record</option>
              <option value="intra_bulk">intra_bulk</option>
              <option value="cross_bulk_set">cross_bulk_set</option>
              <option value="cross_bulk_single">cross_bulk_single</option>
              <option value="dictionary">dictionary</option>
              <option value="external_api">external_api</option>
            </TextField>
            <Box>
              <Typography variant="subtitle2" mb={1}>Rule YAML</Typography>
              <Editor
                height="300px"
                defaultLanguage="yaml"
                value={current?.ruleContent || ""}
                onChange={(val) => setCurrent({ ...current!, ruleContent: val || "" })}
                options={{ minimap: { enabled: false } }}
              />
            </Box>
            <Button variant="outlined" onClick={prettify} sx={{ alignSelf: "flex-start" }}>Prettify YAML</Button>
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

export default RulesList;
