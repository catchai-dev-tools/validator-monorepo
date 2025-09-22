import React from "react";
import { Refine } from "@refinedev/core";
import {
  RefineThemes,
  ThemedLayout,
  ThemedTitle,
  RefineSnackbarProvider,
  ErrorComponent,
} from "@refinedev/mui";
import { CssBaseline, GlobalStyles } from "@mui/material";
import dataProvider from "@refinedev/simple-rest";
import { Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import routerProvider from "@refinedev/react-router-v6";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./pages/Dashboard";
import UsersList from "./pages/users/List";
import DocumentTypesList from "./pages/documentTypes/List";
import BulkFilesList from "./pages/bulkFiles/List";
import RulesList from "./pages/rules/List";
import RuleSetsList from "./pages/ruleSets/List";
import ValidationRunsList from "./pages/validationRuns/List";
import Login from "./pages/Login";
import { authProvider } from "./auth/authProvider";
import { Sidebar } from "./components/layout/Sidebar";
import DocOverview from "@/pages/documentTypes/Overview";
import DocRuleSets from "@/pages/documentTypes/RuleSets";
import DocBulkFiles from "@/pages/documentTypes/BulkFiles";
import DocRuns from "@/pages/documentTypes/Runs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={RefineThemes.Blue}>
        <CssBaseline />
        <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
        <RefineSnackbarProvider>
          <Refine
            dataProvider={dataProvider(`${API_URL}/api`)}
            routerProvider={routerProvider}
            authProvider={authProvider}
            resources={[
              { name: "users", list: "/users" },
              { name: "document-types", list: "/docs" },
              { name: "bulk-files", list: "/bulk-files" },
              { name: "rules", list: "/rules" },
              { name: "rule-sets", list: "/rule-sets" },
              { name: "validation-runs", list: "/runs" },
            ]}
            options={{ syncWithLocation: true }}
          >
            <ThemedLayout
              Sider={() => <Sidebar />}
              Title={({ collapsed }: { collapsed: boolean }) => (
                <ThemedTitle collapsed={collapsed} text="Validator UI" />
              )}
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UsersList />} />
                <Route path="/docs" element={<DocumentTypesList />} />
                <Route path="/docs/:id" element={<Navigate to="/docs/:id/overview" replace />} />
                <Route path="/docs/:id/overview" element={<DocOverview />} />
                <Route path="/docs/:id/rule-sets" element={<DocRuleSets />} />
                <Route path="/docs/:id/bulk-files" element={<DocBulkFiles />} />
                <Route path="/docs/:id/runs" element={<DocRuns />} />
                <Route path="/bulk-files" element={<BulkFilesList />} />
                <Route path="/rules" element={<RulesList />} />
                <Route path="/rule-sets" element={<RuleSetsList />} />
                <Route path="/runs" element={<ValidationRunsList />} />
                <Route path="*" element={<ErrorComponent />} />
              </Routes>
            </ThemedLayout>
          </Refine>
        </RefineSnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
