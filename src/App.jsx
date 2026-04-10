import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Shell from './components/layout/Shell.jsx';

// Pages
import Dashboard         from './pages/Dashboard.jsx';
import CRM               from './pages/CRM.jsx';
import Leads             from './pages/Leads.jsx';
import AIAssistant       from './pages/AIAssistant.jsx';
import ResearchLab       from './pages/ResearchLab.jsx';
import Outreach          from './pages/Outreach.jsx';
import Proposals         from './pages/Proposals.jsx';
import Analytics         from './pages/Analytics.jsx';
import KnowledgeBase     from './pages/KnowledgeBase.jsx';
import Competition       from './pages/Competition.jsx';
import Connectors        from './pages/Connectors.jsx';
import Admin             from './pages/Admin.jsx';
import Settings          from './pages/Settings.jsx';

// XPS System pages
import AdminControlPlane from './pages/xps/AdminControlPlane.jsx';
import VisionCortex      from './pages/xps/VisionCortex.jsx';
import AutoBuilder       from './pages/xps/AutoBuilder.jsx';
import IntelCore         from './pages/xps/IntelCore.jsx';
import Sandbox           from './pages/xps/Sandbox.jsx';
import Quarantine        from './pages/xps/Quarantine.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="crm"          element={<CRM />} />
          <Route path="leads"        element={<Leads />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="research"     element={<ResearchLab />} />
          <Route path="outreach"     element={<Outreach />} />
          <Route path="proposals"    element={<Proposals />} />
          <Route path="analytics"    element={<Analytics />} />
          <Route path="knowledge"    element={<KnowledgeBase />} />
          <Route path="competition"  element={<Competition />} />
          <Route path="connectors"   element={<Connectors />} />
          <Route path="admin"        element={<Admin />} />
          <Route path="settings"     element={<Settings />} />

          <Route path="xps/admin"      element={<AdminControlPlane />} />
          <Route path="xps/vision"     element={<VisionCortex />} />
          <Route path="xps/builder"    element={<AutoBuilder />} />
          <Route path="xps/intel"      element={<IntelCore />} />
          <Route path="xps/sandbox"    element={<Sandbox />} />
          <Route path="xps/quarantine" element={<Quarantine />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
