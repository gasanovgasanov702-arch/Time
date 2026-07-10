# Timer Pro - Auto-Update System

## 🔄 How Auto-Updates Work

Timer Pro has a built-in auto-update system that checks for new versions automatically.

### Configuration

1. **Edit `update-server.json`** (located next to TimerPro.exe):
```json
{
  "updateUrl": "https://your-server.com/updates/"
}
```

2. **Replace the URL** with your actual update server address.

### Setting Up Your Update Server

You need a web server (any HTTP server works) that hosts:

1. **TimerPro.exe** - The new version of the app
2. **latest.yml** - Update metadata (generated automatically by electron-builder)

#### Example Server Structure:
```
https://your-server.com/updates/
├── TimerPro.exe          (new version)
└── latest.yml            (update info)
```

### Creating an Update

When you want to release a new version:

1. **Update version in `package.json`**:
```json
{
  "version": "1.1.0"
}
```

2. **Rebuild the app**:
```bash
npm run build
```

3. **Upload to your server**:
   - Upload `dist/TimerPro.exe`
   - Upload `dist/latest.yml` (auto-generated)

4. **Users will be notified** automatically when they launch the app or click "Check Updates".

### Update Flow

1. App launches → checks for updates after 3 seconds
2. If update available → shows modal with version info
3. User clicks "Download & Install" → downloads with progress bar
4. Download complete → user clicks "Restart & Install"
5. App restarts with new version

### Manual Update Check

Users can click the **"Check Updates"** button in the app to manually check for updates.

### Features

✅ Automatic update check on app launch  
✅ Manual update check button  
✅ Progress bar with download speed  
✅ Version comparison display  
✅ Release notes support  
✅ Portable - works from any location  
✅ Configurable update server  

### Notes

- The `update-server.json` file must be in the same folder as `TimerPro.exe`
- If no update server is configured, update checks will fail silently
- Updates are optional - users can skip them
- The app continues to work even if the update server is offline
