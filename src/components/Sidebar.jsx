import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Calendar, PlusCircle, FileText, MoreHorizontal } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/events', icon: <Calendar size={20} />, label: 'Events' },
    { to: '/reports', icon: <FileText size={20} />, label: 'Reports' },
    { to: '/more', icon: <MoreHorizontal size={20} />, label: 'More' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-slate-200 h-screen fixed top-0 left-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <h1 className="text-xl font-bold text-primary-600">Tridalam</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <Link to="/add" className="w-full btn-primary flex justify-center items-center space-x-2">
          <PlusCircle size={18} />
          <span>New Event</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
