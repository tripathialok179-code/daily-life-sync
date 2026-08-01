import React, { useState } from 'react';
import { ThemeMode, ThemeColor } from '../types';
import { Monitor, Moon, Sun, Trash2, Check, Palette, Bell } from 'lucide-react';
import Ripple from './Ripple';

interface SettingsViewProps {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  themeColor: ThemeColor;
  setThemeColor: (c: ThemeColor) => void;
  clearData: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ theme, setTheme, themeColor, setThemeColor, clearData }) => {
  const [notifPermission, setNotifPermission] = useState<string>('default');

  React.useEffect(() => {
    const checkPermissionState = async () => {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const status = await LocalNotifications.checkPermissions();
          setNotifPermission(status.display);
        } catch (e) {
          console.error("Capacitor check permissions error:", e);
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotifPermission(Notification.permission);
      }
    };
    checkPermissionState();
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        let status = await LocalNotifications.checkPermissions();
        if (status.display === 'prompt' || status.display === 'prompt-with-rationale') {
          status = await LocalNotifications.requestPermissions();
        }
        setNotifPermission(status.display);
        if (status.display === 'granted') {
          alert("System notifications enabled successfully! 🔔");
        } else {
          alert("Notifications blocked. Please navigate to your Phone Settings -> Apps -> Daily Life Sync -> Notifications and enable them manually!");
        }
      } catch (e) {
        console.error("Capacitor request permission error:", e);
        alert("Failed to request system notification permissions on this device.");
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        alert("System notifications enabled successfully! 🔔");
      } else if (permission === 'denied') {
        alert("Notifications blocked. If you are on a mobile device, please navigate to your Phone Settings -> Apps -> Daily Life Sync -> Notifications and enable them manually!");
      }
    } else {
      alert("System notifications are not supported on this platform/device.");
    }
  };

  const ThemeOption = ({ mode, icon: Icon, label }: { mode: ThemeMode, icon: any, label: string }) => (
    <button
      onClick={() => setTheme(mode)}
      className={`relative overflow-hidden flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
        theme === mode 
          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm' 
          : 'border-transparent bg-white/40 dark:bg-gray-800/40 text-gray-500 hover:bg-white/60 dark:hover:bg-gray-800/60'
      }`}
    >
      <Ripple className={theme === mode ? 'bg-brand-500/20' : 'bg-gray-400/20'} />
      <Icon size={28} className="mb-3" strokeWidth={1.5} />
      <span className="font-medium font-display">{label}</span>
    </button>
  );

  const ColorOption = ({ color, bgClass }: { color: ThemeColor, bgClass: string }) => (
    <button
      onClick={() => setThemeColor(color)}
      className={`relative overflow-hidden w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${bgClass} ${
        themeColor === color ? 'ring-4 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900 ring-gray-200 dark:ring-gray-700 scale-110' : 'hover:scale-105'
      }`}
    >
      <Ripple className="bg-white/40" />
      {themeColor === color && <Check className="text-white w-5 h-5" strokeWidth={3} />}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up pb-20">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold font-display text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-500 font-light text-lg">Personalize your Daily Life Sync.</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-panel p-8 rounded-[2.5rem] shadow-sm">
        <h2 className="text-xl font-bold font-display mb-6 dark:text-white flex items-center">
          <Palette className="mr-2 text-brand-500" size={24}/> Appearance
        </h2>
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-4">
            <ThemeOption mode="light" icon={Sun} label="Light" />
            <ThemeOption mode="dark" icon={Moon} label="Dark" />
            <ThemeOption mode="system" icon={Monitor} label="System" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Accent Color</label>
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              <ColorOption color="blue" bgClass="bg-sky-500 shadow-lg shadow-sky-500/30" />
              <ColorOption color="purple" bgClass="bg-purple-500 shadow-lg shadow-purple-500/30" />
              <ColorOption color="rose" bgClass="bg-rose-500 shadow-lg shadow-rose-500/30" />
              <ColorOption color="orange" bgClass="bg-orange-500 shadow-lg shadow-orange-500/30" />
              <ColorOption color="emerald" bgClass="bg-emerald-500 shadow-lg shadow-emerald-500/30" />
              <ColorOption color="slate" bgClass="bg-slate-500 shadow-lg shadow-slate-500/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-panel p-8 rounded-[2.5rem] shadow-sm">
        <h2 className="text-xl font-bold font-display mb-4 dark:text-white flex items-center">
          <Bell className="mr-2 text-brand-500" size={24} /> Reminders & Notifications
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Enable system alerts and push reminders to get notified when tasks are due. This helps keep your daily routines synchronized and builds consistent Streaks.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/20 p-5 rounded-2xl">
          <div>
            <p className="font-bold text-sm text-gray-800 dark:text-white">Push Reminders Status</p>
            <p className="text-xs text-gray-450 mt-1">
              {notifPermission === 'granted' 
                ? '🔔 Reminders are successfully configured.' 
                : notifPermission === 'denied' 
                ? '🚫 Blocked in system settings. Enable manually in your phone Settings.' 
                : 'Configure device permissions to receive alerts.'
              }
            </p>
          </div>
          <button 
            onClick={handleRequestPermission}
            disabled={notifPermission === 'granted'}
            className={`relative overflow-hidden flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
              notifPermission === 'granted'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 cursor-default border border-emerald-200/20'
                : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20'
            }`}
          >
            <Ripple />
            {notifPermission === 'granted' ? (
              <span className="flex items-center"><Check size={16} className="mr-1.5" /> Enabled</span>
            ) : (
              'Enable Notifications'
            )}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-panel p-8 rounded-[2.5rem] shadow-sm border-red-100 dark:border-red-900/30">
        <h2 className="text-xl font-bold font-display mb-4 text-red-500 flex items-center">
          <Trash2 className="mr-2" size={24} /> Danger Zone
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          This will delete all local data including tasks, journal entries, and lists. This action takes place immediately and cannot be undone.
        </p>
        <button 
          onClick={() => {
             if(window.confirm("Are you absolutely sure you want to delete all data?")) {
               clearData();
             }
          }}
          className="relative overflow-hidden w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl font-medium transition-colors"
        >
          <Ripple className="bg-red-500/20" />
          Clear All Data
        </button>
      </div>
      
      <div className="text-center py-8">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Daily Life Sync v1.2.0</p>
      </div>
    </div>
  );
};

export default SettingsView;
