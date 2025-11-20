import React, { ReactNode, useEffect, useState } from 'react';
import { AppView, ThemeMode } from '../types';
import { 
  CheckSquare, 
  BookOpen, 
  List as ListIcon, 
  Calendar as CalendarIcon,
  Settings, 
  Sun, 
  Moon, 
  Monitor,
  Menu,
  X,
  NotebookPen
} from 'lucide-react';
import Ripple from './Ripple';

interface LayoutProps {
  children: ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  isSidebarOpen: boolean;
  onSidebarChange: (isOpen: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onChangeView,
  theme,
  onThemeChange,
  isSidebarOpen,
  onSidebarChange
}) => {
  
  // --- PERMANENT GLITCH FIX ---
  // This prevents the sidebar from "sliding" when the app first loads.
  // We only enable animations after 100ms.
  const [enableTransitions, setEnableTransitions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setEnableTransitions(true);
    }, 100); // Wait 100ms before allowing animations
    return () => clearTimeout(timer);
  }, []);
  // -----------------------------

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        if (window.innerWidth < 768) {
           onSidebarChange(false);
        }
      }}
      className={`flex items-center w-full p-3 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
        currentView === view 
          ? 'text-brand-600 dark:text-brand-300 bg-brand-50/50 dark:bg-brand-900/20 shadow-sm ring-1 ring-brand-200 dark:ring-brand-800' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <Ripple className={currentView === view ? 'bg-brand-500/10' : 'bg-gray-400/20'} />
      <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${currentView === view ? 'opacity-100 bg-gradient-to-r from-brand-50/0 via-brand-50/50 to-brand-50/0 dark:from-brand-900/0 dark:via-brand-900/20 dark:to-brand-900/0' : ''}`} />
      <Icon className={`w-5 h-5 mr-3 z-10 transition-transform duration-300 ${currentView === view ? 'scale-110' : 'group-hover:scale-105'}`} strokeWidth={currentView === view ? 2.5 : 2} />
      <span className={`font-medium z-10 ${currentView === view ? 'font-semibold' : ''}`}>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => onSidebarChange(false)}
        />
      )}

      {/* Acrylic Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 p-4 transform flex flex-col
        /* ONLY animate if the app is fully loaded */
        ${enableTransitions ? 'transition-transform duration-300 ease-in-out' : ''}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="glass-panel h-full rounded-3xl flex flex-col shadow-2xl shadow-gray-200/50 dark:shadow-black/50">
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 relative overflow-hidden">
                 <NotebookPen size={22} className="relative z-10" />
                 <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
              </div>
              <span className="text-xl font-display font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                DAILY<br/><span className="text-brand-500">LIFE SYNC</span>
              </span>
            </div>
            <button 
              onClick={() => onSidebarChange(false)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors relative overflow-hidden"
            >
              <Ripple />
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto no-scrollbar">
            <NavItem view="todo" icon={CheckSquare} label="Tasks" />
            <NavItem view="calendar" icon={CalendarIcon} label="Calendar" />
            <NavItem view="journal" icon={BookOpen} label="Journal" />
            <NavItem view="lists" icon={ListIcon} label="Lists" />
          </nav>

          <div className="p-4 mt-auto">
            <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4 mb-2">
              <NavItem view="settings" icon={Settings} label="Settings" />
            </div>
            <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-2xl backdrop-blur-sm mt-4">
              {(['light', 'system', 'dark'] as ThemeMode[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onThemeChange(t)}
                  className={`relative overflow-hidden flex-1 flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                    theme === t 
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400 scale-100' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 scale-95'
                  }`}
                >
                  <Ripple className={theme === t ? 'bg-brand-500/20' : 'bg-gray-400/20'} />
                  {t === 'light' && <Sun size={18} />}
                  {t === 'dark' && <Moon size={18} />}
                  {t === 'system' && <Monitor size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden h-20 glass-panel border-b-0 m-4 rounded-2xl flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <NotebookPen size={18} />
            </div>
            <span className="font-display font-bold text-gray-900 dark:text-white">DAILY LIFE SYNC</span>
          </div>
          <button 
            onClick={() => onSidebarChange(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors relative overflow-hidden"
          >
            <Ripple />
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8 no-scrollbar">
          <div className="max-w-6xl mx-auto pb-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;