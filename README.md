# Eyeris

**Real-time Eye Health Monitoring & Blink Detection Platform**

Eyeris is a comprehensive, cross-platform eye tracking solution leveraging Google's MediaPipe for real-time facial landmark detection and eye blink analysis. Designed to help reduce eye strain by monitoring blink rates and reminding users to take breaks following the 20-20-20 rule.

[![GitHub Release](https://img.shields.io/github/v/release/imnexerio/Eyeris?style=flat-square)](https://github.com/imnexerio/Eyeris/releases/latest)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg?style=flat-square)](LICENSE)

## 📥 Downloads

### Desktop (Tauri)

| Platform | Download |
|----------|----------|
| **Windows** | [Installer (.exe)](https://github.com/imnexerio/Eyeris/releases/latest/download/Eyeris_1.0.3_x64-setup.exe) · [MSI](https://github.com/imnexerio/Eyeris/releases/latest/download/Eyeris_1.0.3_x64_en-US.msi) |
| **macOS (Apple Silicon)** | [DMG](https://github.com/imnexerio/Eyeris/releases/latest/download/Eyeris_1.0.3_aarch64.dmg) |
| **macOS (Intel)** | [DMG](https://github.com/imnexerio/Eyeris/releases/latest/download/Eyeris_1.0.3_x64.dmg) |
| **Linux** | [.deb](https://github.com/imnexerio/Eyeris/releases/latest/download/eyeris_1.0.3_amd64.deb) · [.rpm](https://github.com/imnexerio/Eyeris/releases/latest/download/eyeris-1.0.3-1.x86_64.rpm) · [AppImage](https://github.com/imnexerio/Eyeris/releases/latest/download/eyeris_1.0.3_amd64.AppImage) |

### Mobile

| Platform | Download |
|----------|----------|
| **Android** | [APK](https://github.com/imnexerio/Eyeris/releases/latest/download/Eyeris.apk) |

### Web

No installation required! Visit the [Web App](https://imnexerio.github.io/Eyeris/) directly in your browser.

> 📦 [View all releases](https://github.com/imnexerio/Eyeris/releases)

## 🌟 Overview

Eyeris uses advanced AI-powered computer vision to detect and analyze eye movements and blink patterns in real-time. Built with MediaPipe's Face Landmarker model, it provides accurate facial tracking with minimal computational overhead, making it suitable for various applications including eye strain monitoring, accessibility tools, and interactive experiences.

## 📱 Platforms

### Android
Native Android application with real-time camera processing, analytics, exercises, and customizable themes.

**Key Features:**
- Real-time face landmark detection and eye tracking
- Comprehensive analytics dashboard with blink tracking
- Eye exercise routines for eye health
- 13 customizable color themes
- Material Design UI with bottom navigation
- Settings for personalization and data management

**Tech Stack:**
- Kotlin
- AndroidX & Material Components
- MediaPipe Face Landmarker
- Navigation Components
- SQLite for local data storage

### Desktop (Tauri)
Cross-platform native desktop application built with Tauri v2, offering lightweight performance and modern web-based UI.

**Key Features:**
- Native performance with minimal resource usage (~10MB app size)
- Real-time eye blink detection and tracking
- 20-20-20 rule break reminders for eye health
- Eye strain level monitoring
- Interactive Chart.js visualizations
- Session analytics and history
- Offline support with bundled MediaPipe model

**Tech Stack:**
- Tauri v2 (Rust backend)
- HTML/CSS/JavaScript frontend
- MediaPipe Vision Tasks
- Chart.js for data visualization
- LocalStorage for data persistence

### Desktop (Python - Legacy)
Cross-platform desktop application with a modern GUI built using CustomTkinter.

**Key Features:**
- Real-time webcam-based eye blink detection
- Live camera preview with facial landmark visualization
- Interactive analytics with pie charts showing:
  - Face detection status
  - Eyes open/closed distribution
  - Time-based data filtering
- Customizable settings:
  - Eye animation toggles
  - Notification controls
  - Sound alerts
  - Detection sensitivity adjustment
  - Overview time range (1-24 hours)
- SQLite database for persistent data storage

**Tech Stack:**
- Python 3.x
- CustomTkinter (Modern UI framework)
- OpenCV for video processing
- MediaPipe for face detection
- Matplotlib for data visualization
- Pandas for data analysis
- SQLite for data persistence

**Dependencies:**
```
customtkinter
pillow
mediapipe
pandas
opencv-python
matplotlib
```

### Web
Browser-based eye tracking application with Chart.js visualizations.

**Key Features:**
- Real-time facial landmark detection in browser
- Eye blink tracking with temporal analysis
- Interactive Chart.js visualizations
- LocalStorage for data persistence
- Responsive design
- No installation required

**Tech Stack:**
- Vanilla JavaScript (ES6 modules)
- MediaPipe Vision Tasks (Web)
- Chart.js with Moment.js adapter for time-series
- HTML5 Canvas for rendering
- Web Workers for performance optimization

## 🚀 Getting Started

### Android

**Prerequisites:**
- Android Studio (Koala | 2024.1.1 Patch 1 or later)
- Android SDK with minimum API level support
- Gradle 8.x

**Setup:**
```bash
git clone https://github.com/imnexerio/eyeris.git
cd eyeris/Android
# Open in Android Studio
# Sync Gradle and build
# Run on device or emulator
```

### Desktop (Tauri) - Recommended

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (latest stable)
- Platform-specific dependencies: [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

**Setup:**
```bash
git clone https://github.com/imnexerio/eyeris.git
cd eyeris/Tauri

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

Built executables will be in `src-tauri/target/release/bundle/`.

### Desktop (Python - Legacy)

**Prerequisites:**
- Python 3.8 or higher
- Webcam

**Setup:**
```bash
git clone https://github.com/imnexerio/eyeris.git
cd eyeris/Desktop

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run application
python main.py
```

**Note:** The `face_landmarker.task` model file must be present in the `assets/` directory.

### Web

**Setup:**
```bash
git clone https://github.com/imnexerio/eyeris.git
cd eyeris/Web

# Serve with any HTTP server, e.g.:
python -m http.server 8000
# Or use Live Server extension in VS Code

# Open browser to http://localhost:8000/home.html
```

**Note:** Requires HTTPS or localhost for camera access due to browser security policies.

## 📊 Features Comparison

| Feature | Android | Desktop (Tauri) | Web |
|---------|---------|-----------------|-----|
| Real-time Detection | ✅ | ✅ | ✅ |
| Offline Support | ✅ | ✅ | ✅ (after first load) |
| 20-20-20 Break Reminders | ✅ | ✅ | ✅ |
| Eye Strain Monitoring | ✅ | ✅ | ✅ |
| Data Analytics | ✅ | ✅ | ✅ |
| Native Performance | ✅ | ✅ | ⚠️ |
| Installation Required | ✅ | ✅ | ❌ |
| Platforms | Android | Win/Mac/Linux | Any Browser |
| App Size | ~15MB | ~10MB | N/A |

## 🛠️ Technology Stack

**Core:**
- **MediaPipe Face Landmarker**: Google's ML solution for facial landmark detection
- Real-time video processing with minimal latency
- Support for 478 facial landmarks

**Platform-Specific:**
- **Android**: Kotlin, AndroidX, Material Design
- **Desktop (Tauri)**: Rust, Tauri v2, HTML/CSS/JS, Chart.js
- **Desktop (Python)**: Python, CustomTkinter, OpenCV, Matplotlib
- **Web**: JavaScript ES6, Chart.js, Service Workers

## 📁 Project Structure

```
Eyeris/
├── Android/           # Native Android application
│   ├── app/
│   │   └── src/
│   │       └── main/
│   │           ├── java/com/imnexerio/eyeris/
│   │           │   ├── MainActivity.kt
│   │           │   ├── fragments/
│   │           │   ├── helpers/
│   │           │   ├── services/
│   │           │   └── views/
│   │           ├── res/          # Resources, layouts, themes
│   │           └── assets/       # ML model files
│   └── README.md
├── Tauri/             # Native desktop app (Recommended)
│   ├── src-tauri/     # Rust backend
│   │   ├── src/
│   │   ├── Cargo.toml
│   │   └── tauri.conf.json
│   └── package.json
├── Desktop/           # Python desktop app (Legacy)
│   ├── main.py
│   ├── customtkinter_ui.py
│   ├── requirements.txt
│   └── assets/
├── Web/               # Browser-based application
│   ├── index.html
│   ├── script.js
│   ├── styles.css
│   ├── sw.js          # Service Worker for offline
│   ├── lib/           # Local libraries (MediaPipe, Chart.js)
│   └── assets/        # ML model file
├── .github/workflows/ # CI/CD for automated builds
├── LICENSE            # AGPL-3.0
└── README.md          # This file
```

## 🤝 Contributing

We welcome contributions from the community! Whether it's:
- Bug reports and feature requests
- Code contributions via pull requests
- Documentation improvements
- Testing and feedback

Please feel free to open issues or submit PRs.

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** - see the [LICENSE](LICENSE) file for details.

### Key Points:
- Free to use, modify, and distribute
- Source code must be made available when distributed
- Network use is considered distribution (AGPL requirement)
- Modifications must also be licensed under AGPL-3.0

## 🙏 Acknowledgments

- **MediaPipe** by Google AI - For the powerful face landmarker model
- **Tauri** - Lightweight framework for cross-platform desktop apps
- **Chart.js** - Beautiful JavaScript charting library
- **CustomTkinter** - Modern UI framework for Python desktop apps
- All contributors and users of the Eyeris project

## 📞 Contact & Links

- **Web App**: [https://imnexerio.github.io/Eyeris/](https://imnexerio.github.io/Eyeris/)
- **GitHub**: [https://github.com/imnexerio/Eyeris](https://github.com/imnexerio/Eyeris)
- **Releases**: [https://github.com/imnexerio/Eyeris/releases](https://github.com/imnexerio/Eyeris/releases)
- **MediaPipe Documentation**: [https://ai.google.dev/edge/mediapipe/](https://ai.google.dev/edge/mediapipe/)

---

**Made with ❤️ for eye health and reducing digital eye strain**