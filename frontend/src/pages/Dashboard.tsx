import React from "react";
import { Box, Typography } from "@mui/material";

const Dashboard: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1">
        Welcome to the Data Validator UI. Use the document type tabs to navigate.
      </Typography>
    </Box>
  );
};

export default Dashboard;
