const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),

    // Settings
    loadSettings: () => ipcRenderer.invoke('load-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

    // Timers
    loadTimers: () => ipcRenderer.invoke('load-timers'),
    saveTimer: (timer) => ipcRenderer.invoke('save-timer', timer),
    cancelTimer: (id) => ipcRenderer.invoke('cancel-timer', id),

    // Alarms
    loadAlarms: () => ipcRenderer.invoke('load-alarms'),
    saveAlarm: (alarm) => ipcRenderer.invoke('save-alarm', alarm),
    deleteAlarm: (id) => ipcRenderer.invoke('delete-alarm', id),

    // Statistics
    loadStats: () => ipcRenderer.invoke('load-stats'),
    saveStats: (stats) => ipcRenderer.invoke('save-stats', stats),

    // Updates
    checkUpdates: () => ipcRenderer.send('check-updates'),
    downloadUpdate: () => ipcRenderer.send('download-update'),
    installUpdate: () => ipcRenderer.send('install-update'),

    // Shortcuts & Autostart
    createShortcut: () => ipcRenderer.send('create-shortcut'),
    setAutostart: (enable) => ipcRenderer.send('set-autostart', enable),

    // Version
    getVersionInfo: () => ipcRenderer.invoke('get-version-info'),

    // Events from main process
    onTimerExpired: (callback) => ipcRenderer.on('timer-expired', (_e, data) => callback(data)),
    onAlarmTriggered: (callback) => ipcRenderer.on('alarm-triggered', (_e, data) => callback(data)),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_e, info) => callback(info)),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (_e, progress) => callback(progress)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', () => callback()),
    onShortcutCreated: (callback) => ipcRenderer.on('shortcut-created', () => callback()),
    onQuickAction: (callback) => ipcRenderer.on('quick-action', (_e, action) => callback(action))
});
