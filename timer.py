import os
import sys
import time
import json
import subprocess
import winsound
import ctypes

# ══════════════════════════════════════════════════════════════
#  CONFIGURATION
# ══════════════════════════════════════════════════════════════

CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".timer_cache")
DEFAULT_NAME = "Claude"

try:
    appdata = os.environ.get('APPDATA')
    if appdata:
        settings_path = os.path.join(appdata, 'timer-pro', '.timer_pro_settings')
        if os.path.exists(settings_path):
            with open(settings_path, 'r', encoding='utf-8') as f:
                settings_data = json.load(f)
                if 'defaultTimerName' in settings_data and settings_data['defaultTimerName']:
                    DEFAULT_NAME = settings_data['defaultTimerName']
except Exception:
    pass

# ══════════════════════════════════════════════════════════════
#  CACHE OPERATIONS (atomic read/write)
# ══════════════════════════════════════════════════════════════

def load_cache():
    """Read timer list from cache file."""
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data if isinstance(data.get('timers'), list) else {'timers': []}
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {'timers': []}

def save_cache(data):
    """Atomic write: write to .tmp then replace."""
    tmp_path = CACHE_FILE + ".tmp"
    with open(tmp_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    try:
        os.replace(tmp_path, CACHE_FILE)
    except OSError:
        # Fallback for older Windows
        if os.path.exists(CACHE_FILE):
            os.remove(CACHE_FILE)
        os.rename(tmp_path, CACHE_FILE)

def add_timer(timer_data):
    data = load_cache()
    data['timers'].append(timer_data)
    save_cache(data)

def remove_timer(timer_id):
    data = load_cache()
    data['timers'] = [t for t in data['timers'] if t['id'] != timer_id]
    save_cache(data)

def get_timer_by_id(timer_id):
    data = load_cache()
    for t in data['timers']:
        if t['id'] == timer_id:
            return t
    return None

def get_active_timers():
    """Return list of timers that have not yet expired."""
    data = load_cache()
    now = time.time()
    return [t for t in data['timers'] if t['end_time'] > now]

def cleanup_expired():
    """Remove expired timer records from cache."""
    data = load_cache()
    now = time.time()
    active = [t for t in data['timers'] if t['end_time'] > now]
    if len(active) != len(data['timers']):
        save_cache({'timers': active})

# ══════════════════════════════════════════════════════════════
#  UTILITIES
# ══════════════════════════════════════════════════════════════

def format_hms(seconds):
    """Format seconds as HH:MM:SS."""
    if seconds < 0:
        seconds = 0
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"

def show_notification(title, text):
    """System-level MessageBox (blocking)."""
    try:
        ctypes.windll.user32.MessageBoxW(0, str(text), str(title), 0x30 | 0x1000)
    except Exception:
        pass

def play_alarm():
    """Audible alarm signal."""
    try:
        for _ in range(6):
            winsound.Beep(1000, 500)
            time.sleep(0.15)
    except Exception:
        pass

def generate_id():
    """Generate unique timer ID based on timestamp."""
    return str(int(time.time() * 1000000))

# ══════════════════════════════════════════════════════════════
#  DAEMON MODE (background process)
# ══════════════════════════════════════════════════════════════

def run_daemon(timer_id, end_time_ts):
    """
    Background process. Sleeps until end_time.
    Each second it checks if its timer still exists in cache
    (if user cancelled it — daemon exits silently).
    On completion: plays alarm and shows notification.
    """
    timer_name = DEFAULT_NAME

    while True:
        now = time.time()

        # Check if timer was cancelled by user
        current = get_timer_by_id(timer_id)
        if current is None:
            return  # Timer was cancelled — exit silently

        timer_name = current.get('name', DEFAULT_NAME)

        if now >= end_time_ts:
            break

        # Sleep: 1 second or remaining time, whichever is less
        sleep_dur = min(1.0, end_time_ts - now)
        if sleep_dur > 0:
            time.sleep(sleep_dur)

    # Time is up
    remove_timer(timer_id)
    play_alarm()
    show_notification("TIMER COMPLETED", f"[{timer_name}]  -  Time is up.")

# ══════════════════════════════════════════════════════════════
#  CREATE TIMER
# ══════════════════════════════════════════════════════════════

def create_timer():
    """Interactive creation of a new timer."""
    W = 56
    print()
    print("+" + "-" * W + "+")
    print("|" + "  NEW TIMER SETUP".center(W) + "|")
    print("+" + "-" * W + "+")

    # Name
    name = input(f"  |  Timer name  (Enter for '{DEFAULT_NAME}'): ").strip()
    if not name:
        name = DEFAULT_NAME

    # Duration
    try:
        h_in = input("  |  Hours    (0-99): ").strip()
        m_in = input("  |  Minutes  (0-59): ").strip()
        h = int(h_in) if h_in else 0
        m = int(m_in) if m_in else 0
    except ValueError:
        print("  |  [ERR] Invalid numeric input.")
        print("+" + "-" * W + "+")
        return

    total_seconds = h * 3600 + m * 60
    if total_seconds <= 0:
        print("  |  [ERR] Duration must be greater than zero.")
        print("+" + "-" * W + "+")
        return

    end_time_ts = time.time() + total_seconds
    timer_id = generate_id()

    timer_data = {
        'id': timer_id,
        'name': name,
        'end_time': end_time_ts,
        'duration': total_seconds,
        'created_at': time.time()
    }
    add_timer(timer_data)

    print("  |" + " " * W + "|")
    print(f"  |  [OK] Timer [{name}] set for {format_hms(total_seconds)}".ljust(W) + "|")
    print("  |  Launching background daemon...".ljust(W) + "|")

    # Launch daemon (hidden window)
    python_exe = sys.executable
    script_path = os.path.abspath(__file__)

    subprocess.Popen(
        [python_exe, script_path, "--daemon", timer_id, str(end_time_ts)],
        creationflags=0x08000000,  # CREATE_NO_WINDOW
        close_fds=True
    )

    time.sleep(0.3)
    print("  |  [OK] Daemon started.".ljust(W) + "|")
    print("+" + "-" * W + "+")

# ══════════════════════════════════════════════════════════════
#  CANCEL TIMER
# ══════════════════════════════════════════════════════════════

def cancel_timer():
    """Cancel an existing active timer."""
    timers = get_active_timers()
    if not timers:
        print("\n  [INFO] No active timers to cancel.")
        return

    W = 56
    print()
    print("+" + "-" * W + "+")
    print("|" + "  CANCEL TIMER".center(W) + "|")
    print("+" + "-" * W + "+")

    for i, t in enumerate(timers):
        diff = t['end_time'] - time.time()
        name = t.get('name', DEFAULT_NAME)
        line = f"  [{i+1}]  {name:<25s} {format_hms(diff)} left"
        print("|" + line.ljust(W) + "|")

    print("+" + "-" * W + "+")

    try:
        choice = input("\n  |  Select number to cancel (0 = abort): ").strip()
        idx = int(choice) - 1
        if 0 <= idx < len(timers):
            timer = timers[idx]
            remove_timer(timer['id'])
            # Daemon will detect removal and exit silently on next tick
            print(f"  |  [OK] Timer [{timer['name']}] has been cancelled.")
        else:
            print("  |  [INFO] Cancel aborted.")
    except (ValueError, IndexError):
        print("  |  [ERR] Invalid selection.")

    print("+" + "-" * W + "+")

# ══════════════════════════════════════════════════════════════
#  MAIN MENU
# ══════════════════════════════════════════════════════════════

def show_menu():
    """Render the main menu with active timers list."""
    active = get_active_timers()
    W = 56

    print()
    print("+" + "=" * W + "+")
    print("|" + "  TIMER MANAGEMENT SYSTEM".center(W) + "|")
    print("+" + "=" * W + "+")
    print("|" + f"  Active timers: {len(active)}".ljust(W) + "|")
    
    # Show list of active timers
    if active:
        for t in active:
            diff = t['end_time'] - time.time()
            name = t.get('name', DEFAULT_NAME)
            time_str = format_hms(diff)
            # Truncate name if too long
            display_name = name if len(name) <= 25 else name[:22] + "..."
            line = f"  • {display_name:<25s} {time_str}"
            print("|" + line.ljust(W) + "|")
    else:
        print("|" + "  No active timers".ljust(W) + "|")
    
    print("+" + "-" * W + "+")
    print("|" + "  [1]  Create New Timer".ljust(W) + "|")
    print("|" + "  [2]  Cancel Timer".ljust(W) + "|")
    print("|" + "  [3]  Exit".ljust(W) + "|")
    print("+" + "=" * W + "+")

def main():
    # ── Daemon mode (hidden, launched by create_timer) ──
    if len(sys.argv) > 1 and sys.argv[1] == "--daemon":
        try:
            timer_id = sys.argv[2]
            target_time = float(sys.argv[3])
            run_daemon(timer_id, target_time)
        except Exception:
            pass
        return

    # ── Interactive mode ──
    cleanup_expired()

    while True:
        show_menu()
        try:
            choice = input("\n  > Select option: ").strip()

            if choice == "1":
                create_timer()
            elif choice == "2":
                cancel_timer()
            elif choice == "3":
                print("\n  [INFO] Exiting.\n")
                break
            else:
                print("  [ERR] Invalid option.")
        except (KeyboardInterrupt, EOFError):
            print("\n\n  [INFO] Exiting.\n")
            break

if __name__ == "__main__":
    main()
