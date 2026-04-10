import React, { useState, useCallback } from 'react';
import Sidebar         from './components/Sidebar.jsx';
import CenterWorkspace from './components/CenterWorkspace.jsx';
import ChatRail        from './components/ChatRail.jsx';

export default function App() {
  const [activePanel, setActivePanel]       = useState('dashboard');
  const [workspaceContent, setWorkspaceContent] = useState(null);

  const handleWorkspaceAction = useCallback((action) => {
    // Chat → workspace bridge: switch to workspace panel and show AI output
    if (action.type === 'navigate' && action.panel) {
      setActivePanel(action.panel);
      return;
    }
    setActivePanel('workspace');
    setWorkspaceContent(action);
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: '#08090c',
    }}>
      <Sidebar activePanel={activePanel} onSelect={setActivePanel} />
      <CenterWorkspace activePanel={activePanel} workspaceContent={workspaceContent} />
      <ChatRail onWorkspaceAction={handleWorkspaceAction} />
    </div>
  );
}
