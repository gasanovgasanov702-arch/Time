// Timer Pro v3.0 - Frontend Application Logic

// Application State
let timers = [];
let timerElements = new Map();
let alarms = [];
let alarmElements = new Map();
let stopwatch = {
    running: false,
    startTime: 0,
    elapsed: 0,
    laps: [],
    timerId: null
};

// Pomodoro Focus Mode State
let pomodoro = {
    running: false,
    mode: 'work', // 'work', 'break'
    duration: 25 * 60 * 1000,
    elapsed: 0,
    startTime: 0,
    timerId: null,
    completed: 0,
    streak: 0,
    workDurationMinutes: 25,
    breakDurationMinutes: 5
};

// World Clock State
let worldClocks = [];
let worldClockInterval = null;

// Settings
let settings = {
    soundEnabled: true,
    notificationsEnabled: true,
    autostart: false,
    minimizeToTray: true,
    theme: 'dark',
    accentColor: '#b8924a',
    defaultTimerName: 'Focus Session',
    defaultTimerDuration: 5,
    defaultAlarmTime: '07:00',
    defaultSnooze: 5,
    timerSound: 'default',
    volume: 70,
    worldCities: [] // Saved timezone locations
};

// Stats
let stats = {
    totalTimers: 0,
    completedTimers: 0,
    totalAlarms: 0,
    completedPomo: 0,
    activity: []
};

// Global active alarm holder
let currentTriggeredAlarm = null;

// DOM Elements
const timerList = document.getElementById('timer-list');
const alarmList = document.getElementById('alarm-list');
const worldClockGrid = document.getElementById('world-clock-grid');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // 1. Particle Background Animation
    initParticles();

    // 2. Load Local & Secure IPC configs
    loadSettings();
    loadStats();
    loadTimers();
    loadAlarms();

    // 3. Setup tabs & views
    setupNavigation();
    setupSettingsTabs();
    setupEventListeners();
    setupStopwatch();
    setupAlarms();
    setupPresets();
    setupPomodoro();
    setupWorldClock();

    // Quick-action hooks from system tray
    if (window.electronAPI && window.electronAPI.onQuickAction) {
        window.electronAPI.onQuickAction((action) => {
            if (action === 'new-timer') {
                switchTab('timer');
                openModal('modal-create');
                document.getElementById('input-name').focus();
            } else if (action === 'new-alarm') {
                switchTab('alarm');
                openModal('modal-alarm');
                document.getElementById('input-alarm-name').focus();
            } else if (action === 'start-pomodoro') {
                switchTab('pomodoro');
                startPomoTimer();
            }
        });
    }

    // Check updates check
    setTimeout(() => {
        checkForUpdates(false);
    }, 4000);
});

// Particle Background Logic
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedX = Math.random() * 0.15 - 0.075;
            this.speedY = Math.random() * 0.15 - 0.075;
            this.alpha = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#b8924a';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < 50; i++) {
        particlesArray.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// Navigation Tabs
function setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
}

function switchTab(tabId) {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    contents.forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
}

// Settings Tabs
function setupSettingsTabs() {
    const settingsTabs = document.querySelectorAll('.settings-tab');
    const settingsPanels = document.querySelectorAll('.settings-panel');
    
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPanel = tab.dataset.settingsTab;
            settingsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            settingsPanels.forEach(p => p.classList.remove('active'));
            document.getElementById(`settings-${targetPanel}`).classList.add('active');
        });
    });
}

// Event Listeners for Titlebar & Control Buttons
function setupEventListeners() {
    // Window controls
    document.getElementById('btn-minimize').addEventListener('click', () => window.electronAPI.minimize());
    document.getElementById('btn-maximize').addEventListener('click', () => window.electronAPI.maximize());
    document.getElementById('btn-close').addEventListener('click', () => window.electronAPI.close());
    
    // Menu Dropdown
    const menuBtn = document.getElementById('btn-menu');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
        menuBtn.classList.toggle('active');
    });
    
    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('active');
        menuBtn.classList.remove('active');
    });
    
    // Menu Actions
    document.getElementById('menu-settings').addEventListener('click', () => {
        openModal('modal-settings');
    });
    document.getElementById('menu-shortcut').addEventListener('click', () => {
        window.electronAPI.createShortcut();
    });
    document.getElementById('menu-history').addEventListener('click', () => {
        updateStatsDisplay();
        openModal('modal-history');
    });
    document.getElementById('menu-about').addEventListener('click', () => {
        openModal('modal-about');
    });
    
    // Timers modal triggers
    document.getElementById('btn-new-timer').addEventListener('click', () => {
        const defaultNameInput = document.getElementById('input-name');
        defaultNameInput.value = '';
        defaultNameInput.placeholder = settings.defaultTimerName;
        document.getElementById('input-hours').value = 0;
        document.getElementById('input-minutes').value = settings.defaultTimerDuration;
        document.getElementById('input-seconds').value = 0;
        updateTimerPreview();
        openModal('modal-create');
        defaultNameInput.focus();
    });
    
    document.getElementById('btn-check-update').addEventListener('click', () => {
        checkForUpdates(true);
    });
    
    document.getElementById('modal-close-create').addEventListener('click', () => closeModal('modal-create'));
    document.getElementById('btn-cancel-create').addEventListener('click', () => closeModal('modal-create'));
    document.getElementById('btn-start-timer').addEventListener('click', createTimer);
    
    const inputHours = document.getElementById('input-hours');
    const inputMinutes = document.getElementById('input-minutes');
    const inputSeconds = document.getElementById('input-seconds');
    const inputName = document.getElementById('input-name');
    
    [inputHours, inputMinutes, inputSeconds, inputName].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') createTimer();
        });
    });
    
    [inputHours, inputMinutes, inputSeconds].forEach(input => {
        input.addEventListener('input', updateTimerPreview);
    });
    
    // Alarm modal triggers
    document.getElementById('btn-new-alarm').addEventListener('click', () => {
        document.getElementById('input-alarm-name').value = '';
        document.getElementById('input-alarm-name').placeholder = 'Alarm';
        document.getElementById('input-alarm-time').value = settings.defaultAlarmTime;
        document.getElementById('input-alarm-sound').value = settings.timerSound;
        document.getElementById('input-snooze-duration').value = settings.defaultSnooze.toString();
        document.querySelectorAll('#weekdays-picker .weekday-btn').forEach(btn => btn.classList.remove('active'));
        updateAlarmPreview();
        openModal('modal-alarm');
        document.getElementById('input-alarm-name').focus();
    });
    
    document.getElementById('modal-close-alarm').addEventListener('click', () => closeModal('modal-alarm'));
    document.getElementById('btn-cancel-alarm').addEventListener('click', () => closeModal('modal-alarm'));
    document.getElementById('btn-save-alarm').addEventListener('click', createAlarm);
    
    document.getElementById('input-alarm-time').addEventListener('change', updateAlarmPreview);
    document.getElementById('input-alarm-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createAlarm();
    });
    
    // Triggered alarm buttons
    document.getElementById('btn-snooze-alarm').addEventListener('click', snoozeAlarm);
    document.getElementById('btn-dismiss-alarm').addEventListener('click', dismissAlarm);
    
    // Settings actions
    document.getElementById('modal-close-settings').addEventListener('click', () => closeModal('modal-settings'));
    document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
    document.getElementById('btn-reset-settings').addEventListener('click', resetSettings);
    
    // Volume preview slider
    document.getElementById('setting-volume').addEventListener('input', (e) => {
        document.getElementById('volume-value').textContent = e.target.value + '%';
    });
    document.getElementById('btn-test-sound').addEventListener('click', () => {
        playNotificationSound(document.getElementById('setting-timer-sound').value);
    });
    
    // Themes selector styling binding
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
    
    // Colors selector binding
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
    
    // History modal
    document.getElementById('modal-close-history').addEventListener('click', () => closeModal('modal-history'));
    document.getElementById('btn-close-history').addEventListener('click', () => closeModal('modal-history'));
    document.getElementById('btn-clear-stats').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all statistics and history logs?')) {
            stats = {
                totalTimers: 0,
                completedTimers: 0,
                totalAlarms: 0,
                completedPomo: 0,
                activity: []
            };
            saveStats();
            updateStatsDisplay();
            showToast('Activity statistics cleared', 'info');
        }
    });
    
    // About Modal
    document.getElementById('modal-close-about').addEventListener('click', () => closeModal('modal-about'));
    document.getElementById('btn-close-about').addEventListener('click', () => closeModal('modal-about'));
    
    // Update Modal
    document.getElementById('modal-close-update').addEventListener('click', () => closeModal('modal-update'));
    document.getElementById('btn-later-update').addEventListener('click', () => closeModal('modal-update'));
    document.getElementById('btn-download-update').addEventListener('click', () => {
        window.electronAPI.downloadUpdate();
    });
    
    // Load native app context
    if (window.electronAPI && window.electronAPI.getVersionInfo) {
        window.electronAPI.getVersionInfo().then(info => {
            document.getElementById('app-version').textContent = info.appVersion;
            document.getElementById('about-version').textContent = info.appVersion;
            document.getElementById('about-electron').textContent = info.electron;
            document.getElementById('about-node').textContent = info.node;
            document.getElementById('about-chrome').textContent = info.chrome;
        });
        
        window.electronAPI.onTimerExpired((timer) => handleTimerExpired(timer));
        window.electronAPI.onAlarmTriggered((alarm) => handleAlarmTriggered(alarm));
        window.electronAPI.onUpdateAvailable((info) => showUpdateModal(info));
        window.electronAPI.onUpdateProgress((progress) => updateDownloadProgress(progress));
        window.electronAPI.onUpdateDownloaded(() => {
            const progressText = document.getElementById('update-progress-text');
            const downloadBtn = document.getElementById('btn-download-update');
            if (progressText) progressText.textContent = 'Upgrade package ready to install!';
            if (downloadBtn) {
                downloadBtn.textContent = 'Restart & Complete';
                downloadBtn.onclick = () => window.electronAPI.installUpdate();
            }
        });
        window.electronAPI.onShortcutCreated(() => showToast('Desktop shortcut successfully created!', 'success'));
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
        
        // Ctrl+N -> New Timer
        if (e.ctrlKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            switchTab('timer');
            document.getElementById('btn-new-timer').click();
        }
        
        // Ctrl+P -> Focus Pomodoro Tab & Start / Pause
        if (e.ctrlKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            switchTab('pomodoro');
            document.getElementById('btn-pomo-start').click();
        }
        
        // Spacebar -> Stopwatch active control or Pomodoro active control
        if (e.key === ' ' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
            const activeTab = document.querySelector('.nav-tab.active');
            if (activeTab) {
                const tabName = activeTab.dataset.tab;
                if (tabName === 'stopwatch') {
                    e.preventDefault();
                    document.getElementById('btn-sw-start').click();
                } else if (tabName === 'pomodoro') {
                    e.preventDefault();
                    document.getElementById('btn-pomo-start').click();
                }
            }
        }
    });
}

// Timer Controller Operations
function loadTimers() {
    if (window.electronAPI && window.electronAPI.loadTimers) {
        window.electronAPI.loadTimers().then(loadedTimers => {
            timers = loadedTimers || [];
            renderTimers();
            startTimerUpdates();
        });
    }
}

function createTimer() {
    const inputNameVal = document.getElementById('input-name').value.trim();
    const name = inputNameVal || settings.defaultTimerName;
    const hours = parseInt(document.getElementById('input-hours').value) || 0;
    const minutes = parseInt(document.getElementById('input-minutes').value) || 0;
    const seconds = parseInt(document.getElementById('input-seconds').value) || 0;
    
    if (hours === 0 && minutes === 0 && seconds === 0) {
        showToast('Please specify duration first', 'error');
        return;
    }
    
    const duration = (hours * 3600 + minutes * 60 + seconds) * 1000;
    const timer = {
        id: Date.now().toString(),
        name: name,
        duration: duration,
        endTime: Date.now() + duration,
        createdAt: Date.now()
    };
    
    if (window.electronAPI && window.electronAPI.saveTimer) {
        window.electronAPI.saveTimer(timer).then(() => {
            timers.push(timer);
            stats.totalTimers++;
            addActivity('timer-created', `Started timer "${name}" for ${formatTime(duration)}`);
            saveStats();
            renderTimers();
            closeModal('modal-create');
            showToast(`Timer "${name}" successfully started!`, 'success');
        });
    }
}

function renderTimers() {
    const emptyState = document.getElementById('empty-timers');
    
    // Cancel and purge old timers
    timerElements.forEach((element, id) => {
        if (!timers.find(t => t.id === id)) {
            element.remove();
            timerElements.delete(id);
        }
    });
    
    // Add/Sync timers
    timers.forEach(timer => {
        let element = timerElements.get(timer.id);
        if (!element) {
            element = createTimerElement(timer);
            if (emptyState) emptyState.style.display = 'none';
            timerList.appendChild(element);
            timerElements.set(timer.id, element);
        }
        updateTimerElement(element, timer);
    });
    
    if (timers.length === 0 && emptyState) {
        emptyState.style.display = 'flex';
    }
    
    document.getElementById('active-timers-count').textContent = timers.length;
    
    // Handle badge update
    const badge = document.getElementById('timer-badge');
    if (timers.length > 0) {
        badge.textContent = timers.length;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function createTimerElement(timer) {
    const element = document.createElement('div');
    element.className = 'timer-card';
    element.dataset.timerId = timer.id;
    
    const initials = timer.name.substring(0, 2).toUpperCase();
    
    element.innerHTML = `
        <div class="timer-avatar">${initials}</div>
        <div class="timer-content">
            <div class="timer-name">${timer.name}</div>
            <div class="timer-time" data-time>00:00:00</div>
            <div class="timer-progress">
                <div class="timer-progress-bar" data-progress></div>
            </div>
        </div>
        <button class="timer-cancel" data-cancel title="Cancel Timer">✕</button>
    `;
    
    element.querySelector('[data-cancel]').addEventListener('click', () => {
        cancelTimer(timer.id);
    });
    
    return element;
}

function updateTimerElement(element, timer) {
    const now = Date.now();
    const remaining = Math.max(0, timer.endTime - now);
    const elapsed = timer.duration - remaining;
    const progress = (elapsed / timer.duration) * 100;
    
    const timeDisplay = element.querySelector('[data-time]');
    const progressBar = element.querySelector('[data-progress]');
    
    if (timeDisplay) timeDisplay.textContent = formatTime(remaining);
    if (progressBar) progressBar.style.width = `${progress}%`;
}

function cancelTimer(id) {
    if (window.electronAPI && window.electronAPI.cancelTimer) {
        window.electronAPI.cancelTimer(id).then(() => {
            const cancelledTimer = timers.find(t => t.id === id);
            timers = timers.filter(t => t.id !== id);
            addActivity('timer-cancelled', `Cancelled timer "${cancelledTimer ? cancelledTimer.name : 'Unknown'}"`);
            renderTimers();
            showToast('Timer cancelled', 'info');
        });
    }
}

function handleTimerExpired(timer) {
    timers = timers.filter(t => t.id !== timer.id);
    stats.completedTimers++;
    addActivity('timer-completed', `Timer "${timer.name}" completed successfully`);
    saveStats();
    renderTimers();
    
    if (settings.soundEnabled) {
        playNotificationSound(settings.timerSound);
    }
    showToast(`Timer "${timer.name}" finished!`, 'info');
    document.getElementById('completed-today-count').textContent = stats.completedTimers;
}

function startTimerUpdates() {
    setInterval(() => {
        timers.forEach(timer => {
            const element = timerElements.get(timer.id);
            if (element) {
                updateTimerElement(element, timer);
            }
        });
    }, 100);
}

function updateTimerPreview() {
    const hours = parseInt(document.getElementById('input-hours').value) || 0;
    const minutes = parseInt(document.getElementById('input-minutes').value) || 0;
    const seconds = parseInt(document.getElementById('input-seconds').value) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const preview = document.getElementById('timer-preview');
    if (preview) {
        preview.textContent = `Duration: ${formatTime(totalSeconds * 1000)}`;
    }
}

// Stopwatch Controller Operations
function setupStopwatch() {
    const display = document.getElementById('stopwatch-display');
    const ring = document.getElementById('stopwatch-ring');
    const btnStart = document.getElementById('btn-sw-start');
    const btnLap = document.getElementById('btn-sw-lap');
    const btnReset = document.getElementById('btn-sw-reset');
    const lapsContainer = document.getElementById('laps-container');
    const lapsList = document.getElementById('laps-list');
    const circumference = 2 * Math.PI * 90; // Approx 565.48
    
    btnStart.addEventListener('click', () => {
        if (!stopwatch.running) {
            // Start
            stopwatch.running = true;
            stopwatch.startTime = Date.now() - stopwatch.elapsed;
            btnStart.innerHTML = '<span class="btn-icon">⏸</span><span>Stop</span>';
            btnLap.disabled = false;
            btnReset.disabled = false;
            
            stopwatch.timerId = requestAnimationFrame(updateSWFrame);
        } else {
            // Stop
            stopwatch.running = false;
            stopwatch.elapsed = Date.now() - stopwatch.startTime;
            btnStart.innerHTML = '<span class="btn-icon">▶</span><span>Start</span>';
            btnLap.disabled = true;
            cancelAnimationFrame(stopwatch.timerId);
        }
    });
    
    btnLap.addEventListener('click', () => {
        if (stopwatch.running) {
            const currentMs = Date.now() - stopwatch.startTime;
            const lastLapMs = stopwatch.laps.length > 0 ? stopwatch.laps[0].totalTime : 0;
            const lapDiff = currentMs - lastLapMs;
            
            stopwatch.laps.unshift({
                lapTime: lapDiff,
                totalTime: currentMs
            });
            
            renderLaps();
            lapsContainer.style.display = 'block';
        }
    });
    
    btnReset.addEventListener('click', () => {
        stopwatch.running = false;
        stopwatch.elapsed = 0;
        stopwatch.laps = [];
        cancelAnimationFrame(stopwatch.timerId);
        
        display.textContent = '00:00:00.000';
        ring.style.strokeDashoffset = circumference;
        btnStart.innerHTML = '<span class="btn-icon">▶</span><span>Start</span>';
        btnLap.disabled = true;
        btnReset.disabled = true;
        lapsList.innerHTML = '';
        lapsContainer.style.display = 'none';
        
        document.getElementById('total-laps').textContent = '0';
        document.getElementById('best-lap').textContent = '—';
        document.getElementById('avg-lap').textContent = '—';
    });
    
    document.getElementById('btn-export-laps').addEventListener('click', () => {
        const text = stopwatch.laps.map((lap, i) => {
            const num = stopwatch.laps.length - i;
            return `Lap ${num}: ${formatStopwatchTime(lap.lapTime)} (Total: ${formatStopwatchTime(lap.totalTime)})`;
        }).join('\n');
        
        navigator.clipboard.writeText(text).then(() => {
            showToast('Lap timings copied to clipboard!', 'success');
        });
    });
    
    document.getElementById('btn-clear-laps').addEventListener('click', () => {
        stopwatch.laps = [];
        lapsList.innerHTML = '';
        lapsContainer.style.display = 'none';
        document.getElementById('total-laps').textContent = '0';
        document.getElementById('best-lap').textContent = '—';
        document.getElementById('avg-lap').textContent = '—';
    });
    
    function updateSWFrame() {
        if (stopwatch.running) {
            const elapsed = Date.now() - stopwatch.startTime;
            display.textContent = formatStopwatchTime(elapsed);
            
            // Loop path progress indicator (1 minute scale loop)
            const secondsProgress = (elapsed / 1000) % 60;
            ring.style.strokeDashoffset = circumference * (1 - (secondsProgress / 60));
            
            stopwatch.timerId = requestAnimationFrame(updateSWFrame);
        }
    }
    
    function renderLaps() {
        lapsList.innerHTML = '';
        if (stopwatch.laps.length === 0) return;
        
        let bestIdx = 0;
        let worstIdx = 0;
        stopwatch.laps.forEach((lap, i) => {
            if (lap.lapTime < stopwatch.laps[bestIdx].lapTime) bestIdx = i;
            if (lap.lapTime > stopwatch.laps[worstIdx].lapTime) worstIdx = i;
        });
        
        stopwatch.laps.forEach((lap, index) => {
            const lapNum = stopwatch.laps.length - index;
            const element = document.createElement('div');
            element.className = 'lap-item';
            
            if (stopwatch.laps.length > 1) {
                if (index === bestIdx) element.classList.add('best');
                if (index === worstIdx) element.classList.add('worst');
            }
            
            element.innerHTML = `
                <span>Lap ${lapNum}</span>
                <span>${formatStopwatchTime(lap.lapTime)}</span>
                <span>${formatStopwatchTime(lap.totalTime)}</span>
            `;
            lapsList.appendChild(element);
        });
        
        document.getElementById('total-laps').textContent = stopwatch.laps.length;
        const bestLapMs = Math.min(...stopwatch.laps.map(l => l.lapTime));
        document.getElementById('best-lap').textContent = formatStopwatchTime(bestLapMs);
        
        const avgLapMs = stopwatch.laps.reduce((sum, l) => sum + l.lapTime, 0) / stopwatch.laps.length;
        document.getElementById('avg-lap').textContent = formatStopwatchTime(avgLapMs);
    }
}

function formatStopwatchTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
}

// Alarm Controller Operations
function setupAlarms() {
    document.querySelectorAll('#weekdays-picker .weekday-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            updateAlarmPreview();
        });
    });
    
    document.querySelectorAll('.repeat-presets .preset-btn-small').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            const weekdaysBtns = document.querySelectorAll('#weekdays-picker .weekday-btn');
            weekdaysBtns.forEach(b => b.classList.remove('active'));
            
            if (preset === 'weekdays') {
                [1,2,3,4,5].forEach(d => {
                    document.querySelector(`#weekdays-picker .weekday-btn[data-day="${d}"]`).classList.add('active');
                });
            } else if (preset === 'weekend') {
                [0,6].forEach(d => {
                    document.querySelector(`#weekdays-picker .weekday-btn[data-day="${d}"]`).classList.add('active');
                });
            } else if (preset === 'daily') {
                weekdaysBtns.forEach(b => b.classList.add('active'));
            }
            updateAlarmPreview();
        });
    });
}

function loadAlarms() {
    if (window.electronAPI && window.electronAPI.loadAlarms) {
        window.electronAPI.loadAlarms().then(loadedAlarms => {
            alarms = loadedAlarms || [];
            renderAlarms();
            setInterval(updateNextAlarmLabel, 10000);
        });
    }
}

function createAlarm() {
    const nameInput = document.getElementById('input-alarm-name').value.trim();
    const name = nameInput || 'Alarm';
    const timeVal = document.getElementById('input-alarm-time').value;
    const sound = document.getElementById('input-alarm-sound').value;
    const snoozeDuration = parseInt(document.getElementById('input-snooze-duration').value) || 0;
    const weekdays = Array.from(document.querySelectorAll('#weekdays-picker .weekday-btn.active')).map(btn => parseInt(btn.dataset.day));
    
    if (!timeVal) {
        showToast('Please pick alarm time', 'error');
        return;
    }
    
    const [hours, minutes] = timeVal.split(':').map(Number);
    const alarm = {
        id: Date.now().toString(),
        name: name,
        hours: hours,
        minutes: minutes,
        sound: sound,
        snoozeDuration: snoozeDuration,
        weekdays: weekdays,
        enabled: true,
        nextTrigger: calculateNextTrigger(hours, minutes, weekdays)
    };
    
    if (window.electronAPI && window.electronAPI.saveAlarm) {
        window.electronAPI.saveAlarm(alarm).then(() => {
            alarms.push(alarm);
            stats.totalAlarms++;
            addActivity('alarm-created', `Created alarm "${name}" for ${timeVal}`);
            saveStats();
            renderAlarms();
            closeModal('modal-alarm');
            showToast(`Alarm "${name}" set for ${timeVal}!`, 'success');
        });
    }
}

function renderAlarms() {
    const emptyState = document.getElementById('empty-alarms');
    
    alarmElements.forEach((element, id) => {
        if (!alarms.find(a => a.id === id)) {
            element.remove();
            alarmElements.delete(id);
        }
    });
    
    alarms.forEach(alarm => {
        let element = alarmElements.get(alarm.id);
        if (!element) {
            element = createAlarmElement(alarm);
            if (emptyState) emptyState.style.display = 'none';
            alarmList.appendChild(element);
            alarmElements.set(alarm.id, element);
        }
        updateAlarmElement(element, alarm);
    });
    
    if (alarms.length === 0 && emptyState) {
        emptyState.style.display = 'flex';
    }
    
    updateNextAlarmLabel();
}

function createAlarmElement(alarm) {
    const element = document.createElement('div');
    element.className = 'alarm-card';
    element.dataset.alarmId = alarm.id;
    
    const initials = alarm.name.substring(0, 2).toUpperCase();
    
    element.innerHTML = `
        <div class="alarm-avatar">${initials}</div>
        <div class="alarm-content">
            <div class="alarm-name">${alarm.name}</div>
            <div class="alarm-time">${pad(alarm.hours)}:${pad(alarm.minutes)}</div>
            <div class="alarm-days">${formatWeekdays(alarm.weekdays)}</div>
        </div>
        <div class="alarm-toggle">
            <label class="toggle-switch">
                <input type="checkbox" ${alarm.enabled ? 'checked' : ''} data-toggle>
                <span class="toggle-slider"></span>
            </label>
        </div>
        <button class="alarm-delete" data-delete title="Delete Alarm">✕</button>
    `;
    
    element.querySelector('[data-toggle]').addEventListener('change', (e) => {
        toggleAlarm(alarm.id, e.target.checked);
    });
    element.querySelector('[data-delete]').addEventListener('click', () => {
        deleteAlarm(alarm.id);
    });
    
    return element;
}

function updateAlarmElement(element, alarm) {
    const checkbox = element.querySelector('[data-toggle]');
    if (checkbox) checkbox.checked = alarm.enabled;
    
    if (alarm.enabled) {
        element.classList.add('enabled');
    } else {
        element.classList.remove('enabled');
    }
}

function toggleAlarm(id, enabled) {
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
        alarm.enabled = enabled;
        if (enabled) {
            alarm.nextTrigger = calculateNextTrigger(alarm.hours, alarm.minutes, alarm.weekdays);
        }
        if (window.electronAPI && window.electronAPI.saveAlarm) {
            window.electronAPI.saveAlarm(alarm).then(() => {
                renderAlarms();
            });
        }
    }
}

function deleteAlarm(id) {
    if (window.electronAPI && window.electronAPI.deleteAlarm) {
        window.electronAPI.deleteAlarm(id).then(() => {
            const deletedAlarm = alarms.find(a => a.id === id);
            alarms = alarms.filter(a => a.id !== id);
            addActivity('alarm-deleted', `Deleted alarm "${deletedAlarm ? deletedAlarm.name : 'Unknown'}"`);
            renderAlarms();
            showToast('Alarm deleted', 'info');
        });
    }
}

function updateNextAlarmLabel() {
    const activeAlarms = alarms.filter(a => a.enabled);
    document.getElementById('active-alarms-count').textContent = activeAlarms.length;
    
    const badge = document.getElementById('alarm-badge');
    if (activeAlarms.length > 0) {
        badge.textContent = activeAlarms.length;
        badge.style.display = 'inline-block';
        
        const nextAlarm = activeAlarms.reduce((a, b) => a.nextTrigger < b.nextTrigger ? a : b);
        const diff = nextAlarm.nextTrigger - Date.now();
        document.getElementById('next-alarm-time').textContent = formatTimeShort(diff);
    } else {
        badge.style.display = 'none';
        document.getElementById('next-alarm-time').textContent = '—';
    }
}

function handleAlarmTriggered(alarm) {
    currentTriggeredAlarm = alarm;
    
    document.getElementById('alarm-triggered-name').textContent = alarm.name;
    document.getElementById('alarm-triggered-time').textContent = `${pad(alarm.hours)}:${pad(alarm.minutes)}`;
    
    const snoozeBtn = document.getElementById('btn-snooze-alarm');
    if (alarm.snoozeDuration > 0) {
        snoozeBtn.style.display = 'flex';
        snoozeBtn.querySelector('span:last-child').textContent = `Snooze (${alarm.snoozeDuration}m)`;
    } else {
        snoozeBtn.style.display = 'none';
    }
    
    openModal('modal-alarm-triggered');
    if (settings.soundEnabled) {
        playNotificationSound(alarm.sound || 'default');
    }
    addActivity('alarm-triggered', `Alarm "${alarm.name}" triggered`);
    
    if (alarm.weekdays.length === 0) {
        alarm.enabled = false;
        if (window.electronAPI && window.electronAPI.saveAlarm) {
            window.electronAPI.saveAlarm(alarm);
        }
        renderAlarms();
    }
}

function snoozeAlarm() {
    if (currentTriggeredAlarm && currentTriggeredAlarm.snoozeDuration > 0) {
        currentTriggeredAlarm.nextTrigger = Date.now() + (currentTriggeredAlarm.snoozeDuration * 60 * 1000);
        currentTriggeredAlarm.enabled = true;
        
        if (window.electronAPI && window.electronAPI.saveAlarm) {
            window.electronAPI.saveAlarm(currentTriggeredAlarm).then(() => {
                renderAlarms();
                addActivity('alarm-snoozed', `Snoozed alarm "${currentTriggeredAlarm.name}" for ${currentTriggeredAlarm.snoozeDuration} minutes`);
            });
        }
    }
    closeModal('modal-alarm-triggered');
    currentTriggeredAlarm = null;
}

function dismissAlarm() {
    if (currentTriggeredAlarm && currentTriggeredAlarm.weekdays.length > 0) {
        currentTriggeredAlarm.nextTrigger = calculateNextTrigger(
            currentTriggeredAlarm.hours,
            currentTriggeredAlarm.minutes,
            currentTriggeredAlarm.weekdays
        );
        if (window.electronAPI && window.electronAPI.saveAlarm) {
            window.electronAPI.saveAlarm(currentTriggeredAlarm).then(() => {
                renderAlarms();
            });
        }
    }
    closeModal('modal-alarm-triggered');
    currentTriggeredAlarm = null;
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

function updateAlarmPreview() {
    const timeVal = document.getElementById('input-alarm-time').value;
    const weekdays = Array.from(document.querySelectorAll('#weekdays-picker .weekday-btn.active')).map(btn => parseInt(btn.dataset.day));
    
    const preview = document.getElementById('alarm-preview');
    if (preview && timeVal) {
        const daysText = weekdays.length === 0 ? 'One-time' : formatWeekdays(weekdays);
        preview.textContent = `Alarm at ${timeVal} (${daysText})`;
    }
}

function formatWeekdays(weekdays) {
    if (weekdays.length === 0) return 'One-time';
    if (weekdays.length === 7) return 'Every day';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sorted = [...weekdays].sort((a, b) => a - b);
    
    if (sorted.length === 5 && sorted.join(',') === '1,2,3,4,5') return 'Weekdays';
    if (sorted.length === 2 && sorted.join(',') === '0,6') return 'Weekends';
    return sorted.map(d => dayNames[d]).join(', ');
}

// Pomodoro Focus Mode Logic
function setupPomodoro() {
    const btnStart = document.getElementById('btn-pomo-start');
    const btnReset = document.getElementById('btn-pomo-reset');
    const btnSkip = document.getElementById('btn-pomo-skip');
    
    btnStart.addEventListener('click', () => {
        if (!pomodoro.running) {
            startPomoTimer();
        } else {
            pausePomoTimer();
        }
    });
    
    btnReset.addEventListener('click', () => {
        resetPomoTimer();
    });
    
    btnSkip.addEventListener('click', () => {
        skipPomoCycle();
    });
    
    document.querySelectorAll('.pomo-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pomo-preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            pomodoro.workDurationMinutes = parseInt(btn.dataset.work);
            pomodoro.breakDurationMinutes = parseInt(btn.dataset.break);
            resetPomoTimer();
        });
    });
}

function startPomoTimer() {
    pomodoro.running = true;
    pomodoro.startTime = Date.now() - pomodoro.elapsed;
    document.getElementById('btn-pomo-start').textContent = 'Pause Focus';
    
    pomodoro.timerId = setInterval(updatePomoTick, 100);
}

function pausePomoTimer() {
    pomodoro.running = false;
    pomodoro.elapsed = Date.now() - pomodoro.startTime;
    document.getElementById('btn-pomo-start').textContent = 'Resume Focus';
    clearInterval(pomodoro.timerId);
}

function resetPomoTimer() {
    pomodoro.running = false;
    pomodoro.elapsed = 0;
    clearInterval(pomodoro.timerId);
    
    const targetMin = pomodoro.mode === 'work' ? pomodoro.workDurationMinutes : pomodoro.breakDurationMinutes;
    pomodoro.duration = targetMin * 60 * 1000;
    
    document.getElementById('btn-pomo-start').textContent = 'Start Focus';
    document.getElementById('pomo-time-display').textContent = `${pad(targetMin)}:00`;
    
    const ring = document.getElementById('pomo-ring');
    const circumference = 2 * Math.PI * 95;
    ring.style.strokeDashoffset = circumference;
}

function skipPomoCycle() {
    pomodoro.mode = pomodoro.mode === 'work' ? 'break' : 'work';
    document.getElementById('pomo-mode-title').textContent = pomodoro.mode === 'work' ? 'FOCUS TIME' : 'BREAK TIME';
    showToast(`Skipped to ${pomodoro.mode} session`, 'info');
    resetPomoTimer();
}

function updatePomoTick() {
    const elapsed = Date.now() - pomodoro.startTime;
    const remaining = Math.max(0, pomodoro.duration - elapsed);
    
    const min = Math.floor(remaining / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);
    document.getElementById('pomo-time-display').textContent = `${pad(min)}:${pad(sec)}`;
    
    // Circle Ring progress
    const ring = document.getElementById('pomo-ring');
    const circumference = 2 * Math.PI * 95; // 596.9
    const ratio = remaining / pomodoro.duration;
    ring.style.strokeDashoffset = circumference * (1 - ratio);
    
    if (remaining === 0) {
        clearInterval(pomodoro.timerId);
        pomodoro.running = false;
        
        if (pomodoro.mode === 'work') {
            pomodoro.completed++;
            pomodoro.streak++;
            stats.completedPomo++;
            addActivity('pomodoro-completed', `Focus session finished! PomoCompleted: ${pomodoro.completed}`);
            saveStats();
            
            showToast('Excellent focus! Time to take a short break.', 'success');
            if (settings.soundEnabled) playNotificationSound('gentle');
            
            pomodoro.mode = 'break';
            document.getElementById('pomo-mode-title').textContent = 'BREAK TIME';
            document.getElementById('pomo-completed-count').textContent = pomodoro.completed;
            document.getElementById('pomo-current-streak').textContent = pomodoro.streak;
        } else {
            addActivity('pomodoro-break-finished', 'Break time finished, get back to focus');
            showToast('Break finished! Ready to focus again?', 'info');
            if (settings.soundEnabled) playNotificationSound('default');
            
            pomodoro.mode = 'work';
            document.getElementById('pomo-mode-title').textContent = 'FOCUS TIME';
        }
        
        resetPomoTimer();
    }
}

// World Clock Controller Operations
function setupWorldClock() {
    document.getElementById('btn-add-city').addEventListener('click', () => {
        openModal('modal-add-city');
    });
    
    document.getElementById('modal-close-add-city').addEventListener('click', () => closeModal('modal-add-city'));
    document.getElementById('btn-cancel-add-city').addEventListener('click', () => closeModal('modal-add-city'));
    
    document.getElementById('btn-save-city').addEventListener('click', () => {
        const select = document.getElementById('select-city');
        const [zone, name] = select.value.split('|');
        
        if (worldClocks.some(c => c.timezone === zone)) {
            showToast('Clock already exists!', 'error');
            return;
        }
        
        worldClocks.push({ timezone: zone, cityName: name });
        settings.worldCities = worldClocks;
        saveSettingsDirect();
        
        renderWorldClocks();
        closeModal('modal-add-city');
        showToast(`Clock added for ${name}`, 'success');
    });
}

function setupPresets() {
    document.querySelectorAll('.preset-buttons .preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.sec) {
                document.getElementById('input-hours').value = 0;
                document.getElementById('input-minutes').value = 0;
                document.getElementById('input-seconds').value = btn.dataset.sec;
            } else if (btn.dataset.minutes) {
                const totalMins = parseInt(btn.dataset.minutes);
                document.getElementById('input-hours').value = Math.floor(totalMins / 60);
                document.getElementById('input-minutes').value = totalMins % 60;
                document.getElementById('input-seconds').value = 0;
            }
            updateTimerPreview();
        });
    });
}

function setupWorldClockTick() {
    if (worldClockInterval) clearInterval(worldClockInterval);
    
    worldClockInterval = setInterval(() => {
        const now = new Date();
        
        // 1. Local Time
        const localTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const localDateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
        
        const localTimeEl = document.getElementById('local-clock-time');
        const localDateEl = document.getElementById('local-clock-date');
        
        if (localTimeEl) localTimeEl.textContent = localTimeStr;
        if (localDateEl) localDateEl.textContent = localDateStr;
        
        // 2. Extra clocks
        worldClocks.forEach(clock => {
            const card = document.querySelector(`.world-clock-card[data-timezone="${clock.timezone}"]`);
            if (card) {
                try {
                    const zoneTimeStr = now.toLocaleTimeString([], { timeZone: clock.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                    const zoneDateStr = now.toLocaleDateString([], { timeZone: clock.timezone, weekday: 'long', month: 'long', day: 'numeric' });
                    
                    card.querySelector('.clock-time').textContent = zoneTimeStr;
                    card.querySelector('.clock-date').textContent = zoneDateStr;
                } catch(e) {
                    console.error('World Clock ticks error: ', e);
                }
            }
        });
    }, 1000);
}

function renderWorldClocks() {
    // Keep local clock only
    const cards = worldClockGrid.querySelectorAll('.world-clock-card:not(.local-clock)');
    cards.forEach(c => c.remove());
    
    worldClocks.forEach(clock => {
        const card = document.createElement('div');
        card.className = 'world-clock-card';
        card.dataset.timezone = clock.timezone;
        
        card.innerHTML = `
            <div class="clock-card-header">
                <div class="clock-city">${clock.cityName}</div>
                <div class="clock-timezone-name">${clock.timezone.split('/')[0]}</div>
            </div>
            <div class="clock-time">00:00:00</div>
            <div class="clock-date">Date</div>
            <button class="btn-remove-clock" title="Remove Clock">✕</button>
        `;
        
        card.querySelector('.btn-remove-clock').addEventListener('click', (e) => {
            e.stopPropagation();
            removeWorldClock(clock.timezone);
        });
        
        worldClockGrid.appendChild(card);
    });
}

function removeWorldClock(timezone) {
    worldClocks = worldClocks.filter(c => c.timezone !== timezone);
    settings.worldCities = worldClocks;
    saveSettingsDirect();
    renderWorldClocks();
    showToast('World clock removed', 'info');
}

// Settings Operations
function loadSettings() {
    if (window.electronAPI && window.electronAPI.loadSettings) {
        window.electronAPI.loadSettings().then(loadedSettings => {
            if (loadedSettings) {
                settings = { ...settings, ...loadedSettings };
            }
            applySettingsToUI();
            applyThemeAccent();
            
            // Sync extra clocks state
            if (settings.worldCities) {
                worldClocks = settings.worldCities;
                renderWorldClocks();
            }
            setupWorldClockTick();
        });
    }
}

function saveSettings() {
    settings.soundEnabled = document.querySelector('#toggle-sound input').checked;
    settings.notificationsEnabled = document.querySelector('#toggle-notifications input').checked;
    settings.autostart = document.querySelector('#toggle-autostart input').checked;
    settings.minimizeToTray = document.querySelector('#toggle-tray input').checked;
    settings.timerSound = document.getElementById('setting-timer-sound').value;
    settings.volume = parseInt(document.getElementById('setting-volume').value);
    
    const defaultNameVal = document.getElementById('setting-default-name').value.trim();
    settings.defaultTimerName = defaultNameVal || 'Focus Session';
    
    settings.defaultTimerDuration = parseInt(document.getElementById('setting-default-duration').value) || 5;
    settings.defaultAlarmTime = document.getElementById('setting-default-alarm-time').value || '07:00';
    settings.defaultSnooze = parseInt(document.getElementById('setting-default-snooze').value) || 5;
    
    const selectedTheme = document.querySelector('.theme-option.selected');
    if (selectedTheme) settings.theme = selectedTheme.dataset.theme;
    
    const selectedColor = document.querySelector('.color-option.selected');
    if (selectedColor) settings.accentColor = selectedColor.dataset.color;
    
    saveSettingsDirect().then(() => {
        applyThemeAccent();
        closeModal('modal-settings');
        showToast('Settings saved successfully!', 'success');
    });
}

function saveSettingsDirect() {
    if (window.electronAPI && window.electronAPI.saveSettings) {
        return window.electronAPI.saveSettings(settings);
    }
    return Promise.resolve();
}

function resetSettings() {
    settings = {
        soundEnabled: true,
        notificationsEnabled: true,
        autostart: false,
        minimizeToTray: true,
        theme: 'dark',
        accentColor: '#b8924a',
        defaultTimerName: 'Focus Session',
        defaultTimerDuration: 5,
        defaultAlarmTime: '07:00',
        defaultSnooze: 5,
        timerSound: 'default',
        volume: 70,
        worldCities: worldClocks
    };
    
    applySettingsToUI();
    saveSettingsDirect().then(() => {
        applyThemeAccent();
        showToast('Settings reset to defaults', 'info');
    });
}

function applySettingsToUI() {
    document.querySelector('#toggle-sound input').checked = settings.soundEnabled;
    document.querySelector('#toggle-notifications input').checked = settings.notificationsEnabled;
    document.querySelector('#toggle-autostart input').checked = settings.autostart;
    document.querySelector('#toggle-tray input').checked = settings.minimizeToTray;
    
    document.getElementById('setting-timer-sound').value = settings.timerSound;
    document.getElementById('setting-volume').value = settings.volume;
    document.getElementById('volume-value').textContent = settings.volume + '%';
    
    document.getElementById('setting-default-name').value = settings.defaultTimerName;
    document.getElementById('setting-default-duration').value = settings.defaultTimerDuration;
    document.getElementById('setting-default-alarm-time').value = settings.defaultAlarmTime;
    document.getElementById('setting-default-snooze').value = settings.defaultSnooze;
    
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.theme === settings.theme);
    });
    
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.color === settings.accentColor);
    });
}

function applyThemeAccent() {
    document.body.className = `theme-${settings.theme}`;
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    
    // Hex to RGB conversion for glow variable
    const hex = settings.accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.25)`);
    
    if (window.electronAPI && window.electronAPI.setAutostart) {
        window.electronAPI.setAutostart(settings.autostart);
    }
}

// Statistics Tracking operations
function loadStats() {
    if (window.electronAPI && window.electronAPI.loadStats) {
        window.electronAPI.loadStats().then(loadedStats => {
            if (loadedStats) {
                stats = { ...stats, ...loadedStats };
            }
            document.getElementById('completed-today-count').textContent = stats.completedTimers;
        });
    }
}

function saveStats() {
    if (window.electronAPI && window.electronAPI.saveStats) {
        window.electronAPI.saveStats(stats);
    }
}

function addActivity(type, message) {
    stats.activity.unshift({
        type: type,
        message: message,
        timestamp: Date.now()
    });
    
    if (stats.activity.length > 40) {
        stats.activity = stats.activity.slice(0, 40);
    }
    saveStats();
}

function updateStatsDisplay() {
    document.getElementById('stat-total-timers').textContent = stats.totalTimers || 0;
    document.getElementById('stat-completed-timers').textContent = stats.completedTimers || 0;
    document.getElementById('stat-total-alarms').textContent = stats.totalAlarms || 0;
    document.getElementById('stat-completed-pomo').textContent = stats.completedPomo || 0;
    
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '';
    
    if (!stats.activity || stats.activity.length === 0) {
        activityList.innerHTML = '<div class="empty-state-small">No logged action logs</div>';
        return;
    }
    
    stats.activity.slice(0, 20).forEach(item => {
        const icons = {
            'timer-created': '⏱',
            'timer-completed': '✓',
            'timer-cancelled': '✕',
            'alarm-created': '⏰',
            'alarm-triggered': '🔔',
            'alarm-deleted': '🗑',
            'alarm-snoozed': '💤',
            'pomodoro-completed': '🍅',
            'pomodoro-break-finished': '☕'
        };
        
        const el = document.createElement('div');
        el.className = 'activity-item';
        el.innerHTML = `
            <div class="activity-icon">${icons[item.type] || '•'}</div>
            <div class="activity-info">
                <div class="activity-title">${item.message}</div>
                <div class="activity-time">${formatRelativeTime(item.timestamp)}</div>
            </div>
        `;
        activityList.appendChild(el);
    });
}

// Update Checks
function checkForUpdates(manual = false) {
    const statusEl = document.getElementById('update-status');
    if (statusEl) {
        statusEl.textContent = 'Checking for updates...';
        statusEl.className = 'update-status checking';
    }
    
    if (window.electronAPI && window.electronAPI.checkUpdates) {
        window.electronAPI.checkUpdates();
    }
    
    setTimeout(() => {
        if (statusEl && statusEl.textContent === 'Checking for updates...') {
            statusEl.textContent = '';
            statusEl.className = 'update-status';
            if (manual) {
                showToast('Version is up-to-date!', 'info');
            }
        }
    }, 4000);
}

function showUpdateModal(info) {
    const updateNewVer = document.getElementById('update-new-version');
    const updateCurrVer = document.getElementById('update-current-version');
    const updateNotes = document.getElementById('update-notes');
    
    if (updateNewVer) updateNewVer.textContent = info.version;
    if (updateCurrVer) updateCurrVer.textContent = info.currentVersion;
    if (updateNotes && info.releaseNotes) updateNotes.innerHTML = info.releaseNotes;
    
    const progressContainer = document.getElementById('update-progress-container');
    if (progressContainer) progressContainer.style.display = 'none';
    
    const downloadBtn = document.getElementById('btn-download-update');
    if (downloadBtn) {
        downloadBtn.textContent = 'Download & Install';
        downloadBtn.onclick = () => window.electronAPI.downloadUpdate();
    }
    
    openModal('modal-update');
}

function updateDownloadProgress(progress) {
    const container = document.getElementById('update-progress-container');
    const fill = document.getElementById('update-progress-fill');
    const text = document.getElementById('update-progress-text');
    
    if (container) container.style.display = 'block';
    if (fill) fill.style.width = `${progress.percent}%`;
    if (text) {
        const speed = (progress.bytesPerSecond / 1024 / 1024).toFixed(2);
        text.textContent = `Downloading... ${progress.percent.toFixed(1)}% (${speed} MB/s)`;
    }
}

// General Modal Controls
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

// Sound Synthesizer Engine (Web Audio API)
function playNotificationSound(type = 'default') {
    if (!settings.soundEnabled) return;
    
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const audioCtx = new AudioContext();
        const masterVol = audioCtx.createGain();
        masterVol.gain.value = (settings.volume || 70) / 100;
        masterVol.connect(audioCtx.destination);
        
        const presets = {
            'default': [
                { f: 880, d: 0.1, t: 0.0 },
                { f: 880, d: 0.1, t: 0.15 },
                { f: 880, d: 0.1, t: 0.3 }
            ],
            'gentle': [
                { f: 523.25, d: 0.25, t: 0.0 }, // C5
                { f: 659.25, d: 0.25, t: 0.25 }, // E5
                { f: 783.99, d: 0.25, t: 0.5 },  // G5
                { f: 1046.50, d: 0.4, t: 0.75 }  // C6
            ],
            'urgent': [
                { f: 1200, d: 0.08, t: 0.0 },
                { f: 1000, d: 0.08, t: 0.1 },
                { f: 1200, d: 0.08, t: 0.2 },
                { f: 1000, d: 0.08, t: 0.3 }
            ],
            'melody': [
                { f: 587.33, d: 0.2, t: 0.0 }, // D5
                { f: 659.25, d: 0.2, t: 0.2 }, // E5
                { f: 523.25, d: 0.2, t: 0.4 }, // C5
                { f: 261.63, d: 0.3, t: 0.6 }, // C4
                { f: 392.00, d: 0.4, t: 0.9 }  // G4
            ]
        };
        
        const sequence = presets[type] || presets['default'];
        
        sequence.forEach(note => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(masterVol);
            
            osc.frequency.value = note.f;
            osc.type = 'sine';
            
            const startSec = audioCtx.currentTime + note.t;
            const durationSec = note.d;
            
            gainNode.gain.setValueAtTime(0.2, startSec);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startSec + durationSec);
            
            osc.start(startSec);
            osc.stop(startSec + durationSec);
        });
    } catch(err) {
        console.error('Audio synthesizer error: ', err);
    }
}

// Utility Formatting helpers
function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function formatTimeShort(ms) {
    const totalMins = Math.floor(ms / 60000);
    if (totalMins < 60) return `${totalMins}m`;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs}h ${mins}m`;
}

function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function pad(num, size = 2) {
    return String(num).padStart(size, '0');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 20);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
