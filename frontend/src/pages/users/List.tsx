import React from "react";
import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { api } from "@/api/client";

interface UserRow {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

const UsersList: React.FC = () => {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<UserRow[]>("/api/users");
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns: GridColDef<UserRow>[] = [
    { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
    { field: "role", headerName: "Role", width: 140 },
    { field: "createdAt", headerName: "Created", flex: 1, minWidth: 180, valueGetter: (p) => new Date(p.value as string).toLocaleString() },
  ];

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Users</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={fetchUsers}>Refresh</Button>
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

export default UsersList;
