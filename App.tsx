import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TodoView from './components/TodoView';
import JournalView from './components/JournalView';
import ListsView from './components/ListsView';
import SettingsView from './components/SettingsView';
import CalendarView from './components/CalendarView';
import { AppView, ThemeMode, ThemeColor, TodoItem, JournalEntry, CustomList, migrateTodos, getLocalTodayString, isTaskActiveOnDate, isTaskCompletedOnDate } from './types';
import { Bell } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { requestNotificationPermissions, syncCapacitorNotifications } from './utils/NotificationService';

// RGB values for themes
const THEME_COLORS: Record<ThemeColor, Record<string, string>> = {
  blue: {
    50: '240 249 255', 100: '224 242 254', 500: '14 165 233', 600: '2 132 199', 900: '12 74 110'
  },
  purple: {
    50: '250 245 255', 100: '243 232 255', 500: '168 85 247', 600: '147 51 234', 900: '88 28 135'
  },
  rose: {
    50: '255 241 242', 100: '255 228 230', 500: '244 63 94', 600: '225 29 72', 900: '136 19 55'
  },
  orange: {
    50: '255 247 237', 100: '255 237 213', 500: '249 115 22', 600: '234 88 12', 900: '124 45 18'
  },
  emerald: {
    50: '236 253 245', 100: '209 250 229', 500: '16 185 129', 600: '5 150 105', 900: '6 78 59'
  },
  slate: {
    50: '248 250 252', 100: '241 245 249', 500: '100 116 139', 600: '71 85 105', 900: '15 23 42'
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('todo');
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [themeColor, setThemeColor] = useState<ThemeColor>('blue');
  
  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // Desktop = Open, Mobile = Closed
    }
    return false;
  });

  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  // Data State
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('ls_todos');
    return saved ? migrateTodos(JSON.parse(saved)) : [];
  });
  
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('ls_journal');
    return saved ? JSON.parse(saved) : [];
  });

  const [customLists, setCustomLists] = useState<CustomList[]>(() => {
    const saved = localStorage.getItem('ls_lists');
    return saved ? JSON.parse(saved) : [];
  });

  // Global synchronization for Capacitor has been moved to NotificationService.ts action triggers.

  const sendSystemNotification = async (title: string, body: string) => {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const granted = await LocalNotifications.checkPermissions();
        if (granted.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [
              {
                title,
                body,
                id: Math.floor(Math.random() * 1000000),
              }
            ]
          });
        }
      } catch (e) {
        console.error("Capacitor local notification trigger error:", e);
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  // Synchronize IPC notifications on desktop whenever tasks change
  useEffect(() => {

    // Sync to Electron main process for deep-background notifications
    const electronRequire = (window as any).require;
    if (electronRequire) {
      try {
        const { ipcRenderer } = electronRequire('electron');
        const todayStr = getLocalTodayString();
        const activeTodosToday = todos.filter(t => !t.archived && isTaskActiveOnDate(t, todayStr) && !isTaskCompletedOnDate(t, todayStr) && t.time);
        
        ipcRenderer.send('schedule-notifications', activeTodosToday.map(t => ({
          id: t.id,
          title: t.title,
          body: t.description || 'Task is due now! 🔔',
          time: t.time
        })));
      } catch (e) {
        console.error("IPC Sync failed:", e);
      }
    }
  }, [todos]);

  // Background interval check for active notifications (web / Electron / when app is open)
  useEffect(() => {
    const checkReminders = () => {
      const todayStr = getLocalTodayString();
      const now = new Date();
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      todos.forEach(todo => {
        if (!todo.archived && isTaskActiveOnDate(todo, todayStr) && !isTaskCompletedOnDate(todo, todayStr)) {
          if (todo.time === currentHourMin) {
            const notifKey = `ls_notified_${todo.id}_${todayStr}`;
            if (!localStorage.getItem(notifKey)) {
              localStorage.setItem(notifKey, 'true');
              sendSystemNotification(todo.title, todo.description || 'Task is due now! 🔔');
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [todos]);

  // Request native notification permissions strictly once on mount
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const handleAllowNotifications = async () => {
    localStorage.setItem('ls_notif_prompted', 'true');
    setShowNotifPrompt(false);
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        let status = await LocalNotifications.checkPermissions();
        if (status.display === 'prompt' || status.display === 'prompt-with-rationale') {
          status = await LocalNotifications.requestPermissions();
        }
        if (status.display === 'granted') {
          alert("Alert notification settings enabled successfully! 🔔");
          syncCapacitorNotifications(todos);
        }
      } catch (e) {
        console.error(e);
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert("Alert notification settings enabled successfully! 🔔");
      }
    }
  };

  const handleDismissNotifications = () => {
    localStorage.setItem('ls_notif_prompted', 'true');
    setShowNotifPrompt(false);
  };


  // Theme Mode Effect
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('ls_theme', theme);
  }, [theme]);

  // Theme Color Effect
  useEffect(() => {
    const root = window.document.documentElement;
    const colors = THEME_COLORS[themeColor];
    
    // Inject CSS variables
    root.style.setProperty('--brand-50', colors[50]);
    root.style.setProperty('--brand-100', colors[100]);
    root.style.setProperty('--brand-500', colors[500]);
    root.style.setProperty('--brand-600', colors[600]);
    root.style.setProperty('--brand-900', colors[900]);
    
    localStorage.setItem('ls_theme_color', themeColor);
  }, [themeColor]);

  // Persistence
  useEffect(() => { localStorage.setItem('ls_todos', JSON.stringify(todos)); }, [todos]);
  useEffect(() => { localStorage.setItem('ls_journal', JSON.stringify(journalEntries)); }, [journalEntries]);
  useEffect(() => { localStorage.setItem('ls_lists', JSON.stringify(customLists)); }, [customLists]);

  // Initial Load
  useEffect(() => {
    const savedTheme = localStorage.getItem('ls_theme') as ThemeMode;
    if (savedTheme) setTheme(savedTheme);
    const savedColor = localStorage.getItem('ls_theme_color') as ThemeColor;
    if (savedColor && THEME_COLORS[savedColor]) setThemeColor(savedColor);
  }, []);

  const handleClearData = () => {
    setTodos([]);
    setJournalEntries([]);
    setCustomLists([]);
    localStorage.clear();
    localStorage.setItem('ls_theme', theme);
    localStorage.setItem('ls_theme_color', themeColor);
  };

  return (
    <Layout
      currentView={currentView}
      onChangeView={setCurrentView}
      theme={theme}
      onThemeChange={setTheme}
      // --- FIX: Pass the state down to Layout ---
      isSidebarOpen={isSidebarOpen}
      onSidebarChange={setSidebarOpen}
    >
      {currentView === 'todo' && <TodoView todos={todos} setTodos={setTodos} journalEntries={journalEntries} />}
      {currentView === 'journal' && <JournalView entries={journalEntries} setEntries={setJournalEntries} />}
      {currentView === 'lists' && <ListsView lists={customLists} setLists={setCustomLists} />}
      {currentView === 'calendar' && (
        <CalendarView 
          todos={todos} 
          journalEntries={journalEntries} 
          setTodos={setTodos}
          setJournalEntries={setJournalEntries}
          navigateTo={setCurrentView}
        />
      )}
      {currentView === 'settings' && (
        <SettingsView 
          theme={theme} 
          setTheme={setTheme} 
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          clearData={handleClearData}
        />
      )}
      {showNotifPrompt && (
        <div className="fixed bottom-6 left-6 z-[100] glass-panel p-6 rounded-[2rem] shadow-2xl animate-slide-in-left max-w-sm border border-brand-500/20 bg-gradient-to-tr from-brand-50/50 to-transparent dark:from-brand-950/20">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 shrink-0">
              <Bell size={24} className="animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white font-display text-base">Enable Reminders?</h4>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-relaxed">
                Get push notifications for your daily tasks, habits, and streak reminders!
              </p>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={handleAllowNotifications}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Enable
                </button>
                <button 
                  onClick={handleDismissNotifications}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl text-xs font-bold transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;