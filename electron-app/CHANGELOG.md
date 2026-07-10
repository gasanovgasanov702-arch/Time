# Timer Pro v1.1.0 - Changelog

## New Features

### 🎨 Menu System (☰ Button)
- **Location**: Top right corner, next to window controls
- **Settings** (⚙): Customize app behavior and appearance
- **Create Desktop Shortcut** (⊞): One-click shortcut creation
- **About** (ℹ): App version and system info

### ⚙️ Settings Panel
**General:**
- Sound Notifications: Toggle alarm sounds
- System Notifications: Toggle Windows notifications
- Start with Windows: Auto-launch on startup

**Appearance:**
- Theme: Dark (default), Midnight, Charcoal
- Accent Color: 5 color options (Gold, Blue, Green, Pink, Purple)

**Timer Defaults:**
- Default Name: Custom default timer name (default: "Claude")
- Default Duration: Custom default duration in minutes

### 🎯 Timer Avatars
- Each timer now has a colored avatar/icon
- Shows first 2 letters of timer name
- Special icon (⏱) for "Claude" timers
- Gradient background with accent color

### 🔔 Toast Notifications
- Non-intrusive notifications in bottom-right corner
- Success, error, and info types
- Auto-dismiss after 3 seconds
- Smooth slide-in/out animations

### 🖥️ Desktop Shortcut
- Creates Windows shortcut (.lnk) on Desktop
- Uses app icon
- Points to portable EXE location
- Works from any folder

### 📊 About Modal
- App version display
- System information:
  - Electron version
  - Node.js version
  - Chrome version

## Improvements

### Auto-Update System
- **Check Updates button**: Manual update check
- **Progress tracking**: Real-time download progress with speed
- **Auto-install**: One-click restart and install
- **Update server config**: Edit `update-server.json` to set your server

### UI Enhancements
- Smoother animations throughout
- Better visual hierarchy
- Improved modal designs
- Enhanced color picker
- Toggle switches for settings

### Bug Fixes
- Fixed timer jitter (DOM elements no longer recreated)
- Improved build process (auto-cleans previous builds)
- Better error handling

## Technical Changes

### New Files
- `generate-icon.js`: Auto-generates app icon
- `assets/icon.svg`: Vector icon source
- `.timer_settings`: Settings storage (portable)

### Updated Files
- `main.js`: Added settings IPC, shortcut creation, version info
- `preload.js`: Exposed new APIs to renderer
- `app.js`: Menu system, settings, toasts, avatars
- `index.html`: Menu, settings modal, about modal, toasts
- `styles.css`: Menu styles, settings styles, toast styles
- `package.json`: Version 1.1.0, PNG icon support
- `setup.bat`: Auto-clean build, icon generation

### Settings Storage
Settings are stored in `.timer_settings` file next to the EXE:
```json
{
  "sound": true,
  "notifications": true,
  "autostart": false,
  "theme": "dark",
  "accentColor": "#b8924a",
  "defaultName": "Claude",
  "defaultDuration": 5
}
```

## How to Update

### For Users:
1. Click "Check Updates" button in app
2. If update available, click "Download & Install"
3. Wait for download to complete
4. Click "Restart & Install"
5. App will restart with new version

### For Developers:
1. Update version in `package.json`
2. Run `npm run build`
3. Upload to your update server:
   - `dist/TimerPro.exe` (new version)
   - `dist/latest.yml` (auto-generated metadata)
4. Users will receive update automatically

## Keyboard Shortcuts

- **Enter**: Start timer (in create modal)
- **Escape**: Close current modal/menu
- **Click outside**: Close menu/modals

## Portable Features

✅ Fully portable - works from any folder
✅ Settings stored next to EXE
✅ Timers stored next to EXE
✅ Can create desktop shortcut from anywhere
✅ Auto-updates work from any location

---

**Version**: 1.1.0
**Release Date**: 2026-01-07
**Electron**: 28.x
**Node.js**: 20.x
