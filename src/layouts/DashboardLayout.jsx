import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import Topbar from '../components/Topbar';

const getTitleFromPath = (path) => {
  if (path === '/') return 'Dashboard';
  if (path === '/events') return 'Event Master';
  if (path.startsWith('/events/')) return 'Event Workspace';
  if (path === '/add') return 'New Event';
  if (path === '/reports') return 'Reports';
  if (path === '/more') return 'More';
  return 'Dashboard';
};

const DashboardLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = getTitleFromPath(location.pathname);

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
        <Topbar title={title} showMenu={true} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-6">
          <Outlet />
        </main>
        
        <BottomNav />
      </div>
    </div>
  );
};

export default DashboardLayout;
