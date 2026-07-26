import React from 'react';
import { Bell, Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SESSION_KEY = 'tep_auth';

const Topbar = ({ title, showMenu, onMenuClick }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        {showMenu && (
          <button onClick={onMenuClick} className="md:hidden text-slate-600 p-1">
            <Menu size={24} />
          </button>
        )}
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      
      <div className="flex items-center space-x-2">
        <button className="text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-50 relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="hidden md:flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
            TE
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="flex items-center space-x-1.5 text-slate-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 cursor-pointer"
        >
          <LogOut size={17} />
          <span className="hidden md:inline text-xs font-semibold">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
