import React from "react";
import { useEffect, useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import { api } from "@/api/client";
import { useNavigate, useLocation } from "react-router-dom";

interface DocumentType {
  id: string;
  name: string;
  status: string;
}

export const DocTypeTabs: React.FC = () => {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(0);

  useEffect(() => {
    api.get("/api/document-types").then((res) => setDocTypes(res.data));
  }, []);

  useEffect(() => {
    // try to match current route to a doc type
    const parts = location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("docs");
    const id = idx >= 0 ? parts[idx + 1] : undefined;
    if (id) {
      const foundIdx = docTypes.findIndex((d) => d.id === id);
      if (foundIdx >= 0) setValue(foundIdx);
    }
  }, [location.pathname, docTypes]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    const dt = docTypes[newValue];
    if (dt) {
      navigate(`/docs/${dt.id}/overview`);
    }
  };

  if (!docTypes.length) return null;

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
      <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons allowScrollButtonsMobile>
        {docTypes.map((dt) => (
          <Tab key={dt.id} label={dt.name} />
        ))}
      </Tabs>
    </Box>
  );
};
