import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TodoView from './components/TodoView';
import JournalView from './components/JournalView';
import ListsView from './components/ListsView';
import SettingsView from './components/SettingsView';
import CalendarView from './components/CalendarView';
import { AppView, ThemeMode, ThemeColor, TodoItem, JournalEntry, CustomList } from './types';

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
  
  // --- FIX: Initialize Sidebar State based on Screen Size ---
  // This prevents the "ghost menu" glitch by starting closed on mobile
  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // Desktop = Open, Mobile = Closed
    }
    return false;
  });

  // Data State
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('ls_todos');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('ls_journal');
    return saved ? JSON.parse(saved) : [];
  });

  const [customLists, setCustomLists] = useState<CustomList[]>(() => {
    const saved = localStorage.getItem('ls_lists');
    return saved ? JSON.parse(saved) : [];
  });

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
      {currentView === 'todo' && <TodoView todos={todos} setTodos={setTodos} />}
      {currentView === 'journal' && <JournalView entries={journalEntries} setEntries={setJournalEntries} />}
      {currentView === 'lists' && <ListsView lists={customLists} setLists={setCustomLists} />}
      {currentView === 'calendar' && (
        <CalendarView 
          todos={todos} 
          journalEntries={journalEntries} 
          setTodos={setTodos}
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
    </Layout>
  );
};

export default App;