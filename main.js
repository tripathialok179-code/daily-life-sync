// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) return;

const { app, BrowserWindow, Tray, Menu, ipcMain, Notification } = require('electron');
const path = require('path');

// Set Application User Model ID for Windows notifications to work correctly
app.setAppUserModelId('com.Alok.dailylife');

let win = null;
let tray = null;
let isQuitting = false;

// Background notification logic
let scheduledTasks = [];
let notifiedTasks = new Set(); // Prevent duplicate firing

ipcMain.on('schedule-notifications', (event, tasks) => {
  scheduledTasks = tasks;
});

// Extremely lightweight timer that checks tasks every 30 seconds without Chromium
setInterval(() => {
  const now = new Date();
  const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  scheduledTasks.forEach(task => {
    if (task.time === currentHourMin) {
      const notifKey = `${task.id}_${currentHourMin}`;
      if (!notifiedTasks.has(notifKey)) {
        notifiedTasks.add(notifKey);
        if (Notification.isSupported()) {
          new Notification({ title: task.title, body: task.body }).show();
        }
      }
    }
  });
  
  if (currentHourMin === '00:00') {
    notifiedTasks.clear();
  }
}, 30000);

const createWindow = () => {
  if (win) {
    win.show();
    return;
  }
  
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.join(__dirname, 'dist', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // This tells the window to load the built files
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Intercept the close button to run our memory optimization instead
  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      // MEMORY OPTIMIZATION: Destroy the Chromium window to drop RAM usage
      win.destroy();
      win = null;
    }
  });
};

app.whenReady().then(() => {
  createWindow();

  // Initialize System Tray
  tray = new Tray(path.join(__dirname, 'dist', 'icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Daily Life Sync', click: () => createWindow() },
    { type: 'separator' },
    { label: 'Quit', click: () => { 
        isQuitting = true; 
        app.quit(); 
      } 
    }
  ]);
  
  tray.setToolTip('Daily Life Sync - Running in background');
  tray.setContextMenu(contextMenu);
  
  // Re-open window when tray icon is clicked
  tray.on('click', () => createWindow());
});

app.on('window-all-closed', () => {
  // Do nothing! This allows the Node process to stay alive in the background
});