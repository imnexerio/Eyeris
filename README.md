# Eyeris

**Real-time Eye Tracking & Blink Detection Platform**

Eyeris is a comprehensive, cross-platform eye tracking solution leveraging Google's MediaPipe for real-time facial landmark detection and eye blink analysis. Available on Android, Desktop (Windows/Mac/Linux), and Web platforms.

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

### Desktop
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

### Desktop

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

| Feature | Android | Desktop | Web |
|---------|---------|---------|-----|
| Real-time Detection | ✅ | ✅ | ✅ |
| Offline Support | ✅ | ✅ | ❌ |
| Data Analytics | ✅ | ✅ | ✅ |
| Customization | ✅ | ✅ | ⚠️ |
| Installation Required | ✅ | ✅ | ❌ |
| Cross-platform | Android | Win/Mac/Linux | Any Browser |

## 🛠️ Technology Stack

**Core:**
- **MediaPipe Face Landmarker**: Google's ML solution for facial landmark detection
- Real-time video processing with minimal latency
- Support for 478 facial landmarks

**Platform-Specific:**
- **Android**: Kotlin, AndroidX, Material Design
- **Desktop**: Python, CustomTkinter, OpenCV, Matplotlib
- **Web**: JavaScript ES6, Chart.js, HTML5 Canvas

## 📁 Project Structure

```
Eyeris-v1/
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
├── Desktop/           # Cross-platform desktop app
│   ├── main.py
│   ├── customtkinter_ui.py
│   ├── requirements.txt
│   ├── assets/
│   │   ├── face_landmarker.task
│   │   └── your_database.db
│   └── README.md
├── Web/              # Browser-based application
│   ├── home.html
│   ├── script.js
│   ├── worker.js
│   ├── styles.css
│   └── contact.html
├── LICENSE           # AGPL-3.0
└── README.md         # This file
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
- **CustomTkinter** - Modern UI framework for Python desktop apps
- **Chart.js** - Beautiful JavaScript charting library
- All contributors and users of the Eyeris project

## 📞 Contact & Links

- **Website**: [https://sites.google.com/view/imnexerio-eyeris/home](https://sites.google.com/view/imnexerio-eyeris/home)
- **GitHub**: [https://github.com/imnexerio/eyeris](https://github.com/imnexerio/eyeris)
- **MediaPipe Documentation**: [https://ai.google.dev/edge/mediapipe/](https://ai.google.dev/edge/mediapipe/)

---

**Made with ❤️ for eye health and computer vision innovation**