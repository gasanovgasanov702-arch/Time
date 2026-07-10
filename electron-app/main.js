const { app, BrowserWindow, ipcMain, Notification, shell, dialog, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let tray = null;
let settings = {};
let timers = [];
let alarms = [];
let stats = {};

const settingsPath = path.join(app.getPath('userData'), '.timer_pro_settings');
const timersPath = path.join(app.getPath('userData'), '.timer_pro_timers');
const alarmsPath = path.join(app.getPath('userData'), '.timer_pro_alarms');
const statsPath = path.join(app.getPath('userData'), '.timer_pro_stats');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 780,
        minWidth: 780,
        minHeight: 580,
        frame: false,
        transparent: false,
        resizable: true,
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    mainWindow.on('close', (e) => {
        if (!app.isQuitting && settings.minimizeToTray !== false) {
            e.preventDefault();
            mainWindow.hide();
        }
    });
}

function createTray() {
    try {
        tray = new Tray(path.join(__dirname, 'assets', 'icon.ico'));
    } catch(e) {
        return;
    }

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Timer Pro',
            click: () => mainWindow.show()
        },
        { type: 'separator' },
        {
            label: 'New Timer',
            click: () => {
                mainWindow.show();
                mainWindow.webContents.send('quick-action', 'new-timer');
            }
        },
        {
            label: 'New Alarm',
            click: () => {
                mainWindow.show();
                mainWindow.webContents.send('quick-action', 'new-alarm');
            }
        },
        {
            label: 'Start Pomodoro',
            click: () => {
                mainWindow.show();
                mainWindow.webContents.send('quick-action', 'start-pomodoro');
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Timer Pro v3.0');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
}

app.whenReady().then(() => {
    loadSettings();
    loadTimers();
    loadAlarms();
    loadStats();
    createWindow();
    createTray();

    // Auto-updater
    try {
        autoUpdater.checkForUpdatesAndNotify();
    } catch(e) {
        console.log('Auto-updater not configured');
    }

    autoUpdater.on('update-available', (info) => {
        if (mainWindow) {
            mainWindow.webContents.send('update-available', {
                version: info.version,
                currentVersion: app.getVersion(),
                releaseNotes: info.releaseNotes
            });
        }
    });

    autoUpdater.on('download-progress', (progress) => {
        if (mainWindow) {
            mainWindow.webContents.send('update-progress', progress);
        }
    });

    autoUpdater.on('update-downloaded', () => {
        if (mainWindow) {
            mainWindow.webContents.send('update-downloaded');
        }
    });

    // Check alarms every second
    setInterval(checkAlarms, 1000);
    // Check timers every 100ms
    setInterval(checkTimers, 100);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ═══════════════════════════════════════════
//  IPC: Window Controls
// ═══════════════════════════════════════════

ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('close-window', () => {
    mainWindow.close();
});

// ═══════════════════════════════════════════
//  IPC: Desktop Shortcut
// ═══════════════════════════════════════════

ipcMain.on('create-shortcut', () => {
    try {
        const shortcutPath = path.join(app.getPath('desktop'), 'Timer Pro.lnk');
        const targetPath = app.getPath('exe');
        shell.writeShortcutLink(shortcutPath, 'create', {
            target: targetPath,
            icon: targetPath,
            description: 'Timer Pro — Professional Time Management'
        });
        mainWindow.webContents.send('shortcut-created');
    } catch(e) {
        console.error('Failed to create shortcut:', e);
    }
});

// ═══════════════════════════════════════════
//  IPC: Autostart
// ═══════════════════════════════════════════

ipcMain.on('set-autostart', (event, enable) => {
    app.setLoginItemSettings({
        openAtLogin: enable,
        path: app.getPath('exe')
    });
});

// ═══════════════════════════════════════════
//  Settings
// ═══════════════════════════════════════════

function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
}

ipcMain.handle('load-settings', () => {
    return settings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
    settings = newSettings;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
});

// ═══════════════════════════════════════════
//  Timers
// ═══════════════════════════════════════════

function loadTimers() {
    try {
        if (fs.existsSync(timersPath)) {
            timers = JSON.parse(fs.readFileSync(timersPath, 'utf8'));
            const now = Date.now();
            timers = timers.filter(t => t.endTime > now);
            saveTimers();
        }
    } catch (e) {
        console.error('Failed to load timers:', e);
        timers = [];
    }
}

function saveTimers() {
    fs.writeFileSync(timersPath, JSON.stringify(timers, null, 2));
}

ipcMain.handle('load-timers', () => {
    return timers;
});

ipcMain.handle('save-timer', (event, timer) => {
    timers.push(timer);
    saveTimers();
    return true;
});

ipcMain.handle('cancel-timer', (event, id) => {
    timers = timers.filter(t => t.id !== id);
    saveTimers();
    return true;
});

function checkTimers() {
    const now = Date.now();
    const expired = timers.filter(t => now >= t.endTime);

    expired.forEach(timer => {
        handleTimerExpired(timer);
    });

    if (expired.length > 0) {
        timers = timers.filter(t => now < t.endTime);
        saveTimers();
    }
}

function handleTimerExpired(timer) {
    if (mainWindow) {
        mainWindow.webContents.send('timer-expired', timer);
    }

    if (settings.notificationsEnabled !== false) {
        try {
            new Notification({
                title: 'Timer Pro',
                body: `Timer "${timer.name}" finished!`,
                icon: path.join(__dirname, 'assets', 'icon.ico')
            }).show();
        } catch(e) {}
    }
}

// ═══════════════════════════════════════════
//  Alarms
// ═══════════════════════════════════════════

function loadAlarms() {
    try {
        if (fs.existsSync(alarmsPath)) {
            alarms = JSON.parse(fs.readFileSync(alarmsPath, 'utf8'));
        }
    } catch (e) {
        console.error('Failed to load alarms:', e);
        alarms = [];
    }
}

function saveAlarms() {
    fs.writeFileSync(alarmsPath, JSON.stringify(alarms, null, 2));
}

ipcMain.handle('load-alarms', () => {
    return alarms;
});

ipcMain.handle('save-alarm', (event, alarm) => {
    const index = alarms.findIndex(a => a.id === alarm.id);
    if (index >= 0) {
        alarms[index] = alarm;
    } else {
        alarms.push(alarm);
    }
    saveAlarms();
    return true;
});

ipcMain.handle('delete-alarm', (event, id) => {
    alarms = alarms.filter(a => a.id !== id);
    saveAlarms();
    return true;
});

function checkAlarms() {
    const now = Date.now();
    alarms.forEach(alarm => {
        if (alarm.enabled && alarm.nextTrigger && now >= alarm.nextTrigger) {
            handleAlarmTriggered(alarm);
        }
    });
}

function handleAlarmTriggered(alarm) {
    if (mainWindow) {
        mainWindow.webContents.send('alarm-triggered', alarm);
    }

    if (settings.notificationsEnabled !== false) {
        try {
            new Notification({
                title: 'Alarm',
                body: `${alarm.name} — ${pad(alarm.hours)}:${pad(alarm.minutes)}`,
                icon: path.join(__dirname, 'assets', 'icon.ico')
            }).show();
        } catch(e) {}
    }

    if (alarm.weekdays.length === 0) {
        alarm.enabled = false;
    } else {
        alarm.nextTrigger = calculateNextTrigger(alarm.hours, alarm.minutes, alarm.weekdays);
    }

    saveAlarms();
}

function calculateNextTrigger(hours, minutes, weekdays) {
    const now = new Date();
    let next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    if (weekdays.length === 0) {
        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }
    } else {
        while (next <= now || !weekdays.includes(next.getDay())) {
            next.setDate(next.getDate() + 1);
            next.setHours(hours, minutes, 0, 0);
        }
    }

    return next.getTime();
}

function pad(num) {
    return String(num).padStart(2, '0');
}

// ═══════════════════════════════════════════
//  Statistics
// ═══════════════════════════════════════════

function loadStats() {
    try {
        if (fs.existsSync(statsPath)) {
            stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        }
    } catch (e) {
        stats = {};
    }
}

function saveStatsFile() {
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

ipcMain.handle('load-stats', () => {
    return stats;
});

ipcMain.handle('save-stats', (event, newStats) => {
    stats = newStats;
    saveStatsFile();
    return true;
});

// ═══════════════════════════════════════════
//  Updates
// ═══════════════════════════════════════════

ipcMain.on('check-updates', () => {
    try {
        autoUpdater.checkForUpdates();
    } catch(e) {
        console.log('Update check failed:', e.message);
    }
});

ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
    app.isQuitting = true;
    autoUpdater.quitAndInstall();
});

// ═══════════════════════════════════════════
//  Version Info
// ═══════════════════════════════════════════

ipcMain.handle('get-version-info', () => {
    return {
        appVersion: app.getVersion(),
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome
    };
});
