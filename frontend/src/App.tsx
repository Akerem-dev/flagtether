import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ApiPage } from "./pages/ApiPage";
import { AuditPage } from "./pages/AuditPage";
import { FlagOverviewPage } from "./pages/FlagOverviewPage";
import { FlagsPage } from "./pages/FlagsPage";
import { TargetingPage } from "./pages/TargetingPage";
import type { Environment } from "./types";

export default function App() {
  const [environment, setEnvironment] = useState<Environment>("prod");

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/flags" replace />} />
        <Route path="/flags" element={<FlagsPage environment={environment} onEnvironmentChange={setEnvironment} />} />
        <Route path="/flags/:name" element={<FlagOverviewPage environment={environment} onEnvironmentChange={setEnvironment} />} />
        <Route path="/flags/:name/targeting" element={<TargetingPage environment={environment} onEnvironmentChange={setEnvironment} />} />
        <Route path="/audit" element={<AuditPage environment={environment} onEnvironmentChange={setEnvironment} />} />
        <Route path="/api" element={<ApiPage environment={environment} />} />
        <Route path="*" element={<Navigate to="/flags" replace />} />
      </Route>
    </Routes>
  );
}
