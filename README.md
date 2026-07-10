# ⏱ Timer Pro — Professional Time Management Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-blue.svg)](#)
[![Built with: Electron](https://img.shields.io/badge/Built%20with-Electron-47848F.svg)](#)

Timer Pro is a premium, feature-rich desktop time management suite built with Electron, HTML5, and Vanilla CSS. It provides a stunning glassmorphic UI, smooth micro-animations, customizable dark themes, floating particles, and a set of productivity tools designed to streamline your daily workflow.

---

## 🇷🇺 [Для перехода к разделу на русском языке нажмите здесь](#-timer-pro--профессиональное-управление-временем)

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| **⏱ Multiple Timers** | Launch and track multiple countdown timers simultaneously with active progress bars and high-resolution time formatting. |
| **⏲ Precision Stopwatch** | High-precision millisecond stopwatch featuring live lap recording, stats tracking, best/worst lap highlighting, and clipboard export. |
| **⏰ Alarm Clock** | Configure multiple customizable alarms with snooze intervals, weekly repetitions, custom sounds, and desktop alerts. |
| **🍅 Focus workspace (Pomodoro)** | A beautiful focus tool executing customizable 25/5 focus cycles with interactive rings, completed counters, streaks, and transition notifications. |
| **🌐 World Clock** | Keep track of current times in local and multiple global cities simultaneously (New York, London, Paris, Tokyo, etc.) with automated timezone logic. |
| **🎨 Custom Theme Profiles** | Switch between 5 high-fidelity dark themes (Dark Nebula, Ocean Depth, Forest Night, Midnight Purple, Arctic Ice) and 10+ gorgeous accent colors. |
| **🔊 Web Audio Synth Sounds** | Rich alarms generated using Web Audio API synthesis (Gentle Chime, Urgent Alert, Melody Chords) with manual volume control. |
| **⌨️ Keyboard Shortcuts** | Hotkey support for quick actions (New Timer, Focus mode, Stopwatch toggling) to navigate without a mouse. |
| **📊 Activity Logger** | Logs stats on total timers ran, focus intervals completed, alarm setups, and presents a scrolling history. |
| **⚙️ Default Presets** | Configure default timer duration, snooze times, default names, autostart, and minimize-to-tray settings. |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.x or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository to your machine:
   ```bash
   git clone https://github.com/gasanovgasanov702-arch/Time.git
   ```
2. Navigate into the application directory:
   ```bash
   cd Time/electron-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the application in development mode:
   ```bash
   npm start
   ```

---

## 🔨 Packaging & Building

You can package Timer Pro into a standalone, portable Windows application executable (`TimerPro.exe`) that runs from any folder.

To build the executable:
```bash
npm run build
```
Once completed, the portable production bundle will be located inside the `dist/` directory.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Ctrl + N` | Opens the **New Timer** setup modal | Global in App |
| `Ctrl + P` | Switches view to **Pomodoro** and starts focus cycle | Global in App |
| `Spacebar` | Toggles **Start / Pause** for active tool | Active Stopwatch or Pomodoro |
| `Escape` | Closes any active modal or menu dropdown overlay | Global in App |

---

## 🎨 Themes & Customization

Timer Pro offers 5 unique visual profiles out-of-the-box:
1. **Dark Nebula (Default)**: Sleek absolute black with dark space tones.
2. **Ocean Depth**: Dark navy blue with cyan glowing accents.
3. **Forest Night**: Organic deep emerald green and foliage charcoal.
4. **Midnight Purple**: Cosmic royal violet with bright purple details.
5. **Arctic Ice**: Frost steel gray and glacier blue tones.

To customize themes, open **Settings** (⚙) from the top-right menu dropdown, choose your theme profile, and pick one of the 10 accent tints.

---

## 📄 Tech Stack
- **Core**: Electron (v28.1.0), HTML5, JavaScript
- **Styling**: Vanilla CSS with modern HSL dynamic color tokens, glassmorphism, and keyframe animations
- **Audio**: Web Audio API Synthesizer (No bulky external audio files required)
- **Background**: Canvas particle physics system

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---
---

# ⏱ Timer Pro — Профессиональное управление временем

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-blue.svg)](#)
[![Built with: Electron](https://img.shields.io/badge/Built%20with-Electron-47848F.svg)](#)

Timer Pro — это современное многофункциональное десктопное приложение для управления временем, разработанное с использованием Electron, HTML5 и Vanilla CSS. Приложение предлагает стильный стеклянный дизайн (glassmorphism), плавные микро-анимации, настраиваемые тёмные темы, анимированные фоновые частицы и набор инструментов для эффективной ежедневной работы.

---

## ✨ Возможности

| Функция | Описание |
| :--- | :--- |
| **⏱ Мульти-таймеры** | Запуск и одновременное отслеживание нескольких таймеров обратного отсчёта с индивидуальными полосами прогресса и форматированием высокой точности. |
| **⏲ Точный секундомер** | Высокоточный секундомер с точностью до миллисекунд, записью кругов, выделением лучшего/худшего круга и копированием результатов в буфер обмена. |
| **⏰ Будильник** | Настройка нескольких будильников с выбором дней недели, повторением, интервалом откладывания (snooze), встроенными звуками и уведомлениями. |
| **🍅 Режим Focus (Помодоро)** | Полноценный инструмент для концентрации по методу Pomodoro (25 минут работы / 5 минут отдыха) с кольцевым индикатором, статистикой сессий и уведомлениями. |
| **🌐 Мировые часы** | Одновременный мониторинг текущего времени в локальном часовом поясе и в крупнейших городах мира (Нью-Йорк, Лондон, Париж, Токио и др.). |
| **🎨 Стили оформления** | Переключение между 5 высококачественными тёмными темами (Dark Nebula, Ocean Depth, Forest Night, Midnight Purple, Arctic Ice) и 10+ яркими акцентными цветами. |
| **🔊 Синтезированный звук** | Звуки будильников и таймеров генерируются на лету с помощью Web Audio API (мягкий звон, тревожный сигнал, аккорды мелодии) с возможностью регулировки громкости. |
| **⌨️ Горячие клавиши** | Поддержка клавиатурных комбинаций для быстрого вызова функций без использования мыши. |
| **📊 Статистика активности** | Наглядный подсчет запущенных таймеров, пройденных циклов фокуса, сработавших будильников и лог последних действий. |
| **⚙️ Пресеты по умолчанию** | Настройка стандартного имени таймеров, времени откладывания будильника, автозапуска с Windows и сворачивания в системный трей. |

---

## 🚀 Быстрый старт

### Требования
- [Node.js](https://nodejs.org/) (Версия 18.x или выше)
- npm (пакетный менеджер Node)

### Установка и запуск
1. Клонируйте репозиторий на ваш компьютер:
   ```bash
   git clone https://github.com/gasanovgasanov702-arch/Time.git
   ```
2. Перейдите в папку с приложением Electron:
   ```bash
   cd Time/electron-app
   ```
3. Установите зависимости:
   ```bash
   npm install
   ```
4. Запустите приложение в режиме разработки:
   ```bash
   npm start
   ```

---

## 🔨 Сборка исполняемого файла (EXE)

Вы можете собрать Timer Pro в один независимый портативный исполняемый файл для Windows (`TimerPro.exe`), который запускается из любой папки.

Для сборки выполните:
```bash
npm run build
```
После завершения процесса готовый файл появится в каталоге `dist/`.

---

## ⌨️ Горячие клавиши

| Сочетание клавиш | Действие | Область действия |
| :--- | :--- | :--- |
| `Ctrl + N` | Открывает окно создания нового таймера | Везде в приложении |
| `Ctrl + P` | Переходит на вкладку Помодоро и запускает таймер | Везде в приложении |
| `Space` (Пробел) | Старт / Пауза текущего активного инструмента | Только в секундомере или Помодоро |
| `Escape` | Закрывает любые всплывающие модальные окна или меню | Везде в приложении |

---

## 🎨 Темы оформления

Приложение поддерживает 5 визуальных профилей:
1. **Dark Nebula (По умолчанию)**: Глубокий чёрный цвет с мягкими серыми тонами.
2. **Ocean Depth**: Тёмно-синий морской фон с неоново-голубыми элементами.
3. **Forest Night**: Приглушенные зеленые и болотные тона для любителей природы.
4. **Midnight Purple**: Космический фиолетовый фон со светящимися сиреневыми акцентами.
5. **Arctic Ice**: Стальной холодный серый фон с ледяными голубыми оттенками.

Чтобы изменить тему, откройте **Настройки** (⚙) в меню в верхнем правом углу, перейдите в раздел «Appearance» и выберите желаемую тему и акцентный цвет.

---

## 📄 Технологический стек
- **Ядро**: Electron (v28.1.0), HTML5, JavaScript
- **Стилизация**: Vanilla CSS с использованием динамических переменных HSL, эффекта матового стекла (glassmorphism) и ключевых анимаций
- **Аудио**: Синтезатор на базе Web Audio API (без тяжелых внешних звуковых файлов)
- **Фон**: Интерактивная система летающих частиц на HTML5 Canvas

---

## 📄 Лицензия
Этот проект распространяется под лицензией MIT. Подробности см. в файле [LICENSE](./LICENSE).
