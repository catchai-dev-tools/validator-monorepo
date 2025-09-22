import React, { useEffect, useMemo, useState } from "react";
import { Box, Divider, List, ListItemButton, ListItemText, ListSubheader, Toolbar } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/client";

interface DocumentType {
  id: string;
  name: string;
  status: string;
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);

  useEffect(() => {
    api.get<DocumentType[]>("/api/document-types").then((res) => setDocTypes(res.data));
  }, []);

  const currentDocTypeId = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("docs");
    return idx >= 0 ? parts[idx + 1] : undefined;
  }, [location.pathname]);

  const currentDocType = useMemo(() => docTypes.find((d) => d.id === currentDocTypeId), [docTypes, currentDocTypeId]);

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <Box sx={{ width: 260, flexShrink: 0, borderRight: (t) => `1px solid ${t.palette.divider}`, height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar />
      <Box sx={{ overflowY: "auto", flex: 1 }}>
        <List
          subheader={<ListSubheader component="div">Global</ListSubheader>}
          dense
        >
          <ListItemButton selected={isActive("/")} onClick={() => navigate("/")}> 
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton selected={isActive("/docs")} onClick={() => navigate("/docs")}> 
            <ListItemText primary="Document Types" />
          </ListItemButton>
          <ListItemButton selected={isActive("/rules")} onClick={() => navigate("/rules")}> 
            <ListItemText primary="Rules" />
          </ListItemButton>
          <ListItemButton selected={isActive("/rule-sets")} onClick={() => navigate("/rule-sets")}> 
            <ListItemText primary="Rule Sets" />
          </ListItemButton>
          <ListItemButton selected={isActive("/bulk-files")} onClick={() => navigate("/bulk-files")}> 
            <ListItemText primary="Bulk Files" />
          </ListItemButton>
          <ListItemButton selected={isActive("/runs")} onClick={() => navigate("/runs")}> 
            <ListItemText primary="Validation Runs" />
          </ListItemButton>
          <ListItemButton selected={isActive("/users")} onClick={() => navigate("/users")}> 
            <ListItemText primary="Users" />
          </ListItemButton>
        </List>

        {currentDocType && (
          <>
            <Divider sx={{ my: 1 }} />
            <List
              subheader={<ListSubheader component="div">{currentDocType.name}</ListSubheader>}
              dense
            >
              <ListItemButton selected={isActive(`/docs/${currentDocType.id}/overview`)} onClick={() => navigate(`/docs/${currentDocType.id}/overview`)}>
                <ListItemText primary="Overview" />
              </ListItemButton>
              <ListItemButton selected={isActive(`/docs/${currentDocType.id}/rule-sets`)} onClick={() => navigate(`/docs/${currentDocType.id}/rule-sets`)}>
                <ListItemText primary="Rule Sets" />
              </ListItemButton>
              <ListItemButton selected={isActive(`/docs/${currentDocType.id}/bulk-files`)} onClick={() => navigate(`/docs/${currentDocType.id}/bulk-files`)}>
                <ListItemText primary="Bulk Files" />
              </ListItemButton>
              <ListItemButton selected={isActive(`/docs/${currentDocType.id}/runs`)} onClick={() => navigate(`/docs/${currentDocType.id}/runs`)}>
                <ListItemText primary="Validation Runs" />
              </ListItemButton>
            </List>
          </>
        )}
      </Box>
    </Box>
  );
};
