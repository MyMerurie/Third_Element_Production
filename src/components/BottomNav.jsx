import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, PlusCircle, FileText, MoreHorizontal } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { to: '/', icon: <Home size={24} />, label: 'Home' },
    { to: '/events', icon: <Calendar size={24} />, label: 'Events' },
    { to: '/add', icon: <PlusCircle size={32} className="text-primary-600 drop-shadow-md" />, label: 'Add' },
    { to: '/reports', icon: <FileText size={24} />, label: 'Reports' },
    { to: '/more', icon: <MoreHorizontal size={24} />, label: 'More' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 px-4 py-2 flex justify-between items-end pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center space-y-1 ${
              isActive ? 'text-primary-600' : 'text-slate-500'
            } ${item.label === 'Add' ? '-mt-6' : ''}`
          }
        >
          {item.icon}
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
