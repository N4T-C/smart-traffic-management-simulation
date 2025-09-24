
# Smart Traffic Management Simulation

A comprehensive AI-powered traffic control system developed for the Smart India Hackathon. This project demonstrates intelligent traffic management through real-time vehicle detection, machine learning-based optimization, and dynamic traffic light control using computer vision, reinforcement learning, and web-based visualization.

## 🏗️ System Architecture

- **Frontend**: Canvas-based web simulation with HTML5, CSS3, and JavaScript
- **Backend**: Dual approach with Express.js server and Python Flask application
- **AI Components**: Pygame-based traffic simulation with reinforcement learning
- **Hardware Integration**: Arduino and Raspberry Pi support for IoT prototyping

## 📋 Requirements

### Software Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.11 or higher)
- **Git**

### System Dependencies (for Pygame)
- SDL2 development libraries
- Audio and graphics libraries

## 🔧 Programming Languages Used

### Primary Languages
- **JavaScript (ES6+)**: Frontend simulation, real-time canvas rendering, API communication
- **Python 3.11+**: Machine learning models, data processing, backend algorithms
- **HTML5**: Structure and Canvas API for graphics rendering
- **CSS3**: Responsive design, animations, and visual styling

### Configuration Languages
- **JSON**: Package configuration and data exchange
- **Markdown**: Documentation and project descriptions

## 📦 Modules and Packages Used

### Python Packages
- **pandas**: Data manipulation and CSV file handling for ML training data
- **scikit-learn**: Machine learning algorithms including RandomForestClassifier
- **numpy**: Numerical computing for traffic flow calculations
- **pygame**: Game development library for traffic simulation rendering and physics
- **flask**: Web framework for API endpoints (planned integration)
- **opencv-python**: Computer vision for vehicle detection (planned)
- **tensorflow**: Deep learning framework (planned for advanced ML)
- **pytest**: Testing framework for quality assurance

### Node.js Packages
- **express**: Web server framework for API endpoints and static file serving
- **socket.io**: Real-time bidirectional communication (planned)
- **cors**: Cross-Origin Resource Sharing middleware
- **body-parser**: HTTP request body parsing middleware

### Frontend Technologies
- **HTML5 Canvas API**: 2D graphics rendering for traffic simulation
- **JavaScript Fetch API**: HTTP requests for ML model communication
- **CSS Grid/Flexbox**: Modern layout techniques
- **Web Workers**: Background processing (planned)

### Development Tools
- **npm**: Node.js package manager
- **pip**: Python package installer
- **Git**: Version control system
- **VS Code**: Integrated development environment

## 🚀 Setup Instructions for VS Code

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd smart-traffic-management-simulation
```

### 2. Install System Dependencies

#### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install python3-dev python3-pip nodejs npm
sudo apt install libsdl2-dev libsdl2-image-dev libsdl2-mixer-dev libsdl2-ttf-dev
sudo apt install libfreetype6-dev libportmidi-dev libjpeg-dev libpng-dev
```

#### On macOS:
```bash
# Install Homebrew if you haven't already
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install python3 node npm
brew install sdl2 sdl2_image sdl2_mixer sdl2_ttf
brew install freetype portmidi jpeg libpng
```

#### On Windows:
1. Install [Node.js](https://nodejs.org/) from the official website
2. Install [Python 3.11+](https://python.org/) from the official website
3. Pygame should install automatically with pip (includes SDL2 binaries)

### 3. Install Python Dependencies
```bash
# Install Python packages
pip install pandas scikit-learn numpy pygame flask opencv-python tensorflow pytest
```

### 4. Install Node.js Dependencies
```bash
npm install express cors body-parser
```

### 5. Project Structure
```
smart-traffic-sim/
├── README.md
├── LICENSE
├── requirements.txt
├── package.json
├── server.js
├── .gitignore
├── docs/
│   ├── DESIGN.md
│   └── PROMPTS.md
├── frontend/
│   └── web_sim/
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── backend/
│   ├── flask_app/
│   │   ├── app.py
│   │   └── rl_agent.py
├── model_training/
│   ├── data.csv
│   ├── tain_model.py
│   ├── predict_scheduling.py
│   └── traffic_scheduler_model.pkl
├── models/
│   ├── yolov8/
│   └── checkpoints/
├── notebooks/
│   └── train_detector.ipynb
├── prototype/
│   ├── arduino/
│   │   └── traffic_controller.ino
│   └── raspberry_pi/
│       └── pi_reader.py
├── demo_video.mp4
└── tests/
```

## 🎮 Running the Application

### Method 1: Run Both Components Separately

#### Terminal 1 - Start the Web Server:
```bash
npm start
```
This starts the Express.js server on `http://localhost:5000`

#### Terminal 2 - Start the Pygame Simulation:
```bash
cd backend/flask_app
python app.py
```

### Method 2: Using VS Code Tasks (Recommended)

1. Open the project in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Tasks: Run Task"
4. Select either:
   - "Start Web Server" 
   - "Start Traffic Simulation"
   - "Start Both Services"

## 🎯 Usage Instructions

### Web Interface
1. Open your browser and navigate to `http://localhost:5000`
2. Use the interactive dashboard to:
   - Monitor real-time traffic data
   - View intersection statistics
   - Control simulation parameters

### Pygame Simulation Controls
- **SPACE**: Spawn emergency vehicle
- **1-4**: Spawn vehicle in specific lane (North, East, South, West)
- **ESC**: Exit simulation

### Features
- **12-Direction Vehicle Movement**: Support for straight, left turn, and right turn from each direction
- **Dynamic Traffic Lights**: AI-controlled timing based on vehicle density
- **Emergency Vehicle Priority**: Automatic green light for emergency vehicles
- **Real-time Statistics**: Vehicle count, wait times, and flow metrics
- **Multi-lane Intersection**: 4-way crossroad simulation with turning movements
- **Machine Learning Predictions**: Traffic pattern analysis and optimization
- **Safety Systems**: Accident detection and rapid clearing (0.4 seconds)

## 🔧 Development

### VS Code Extensions (Recommended)
- Python
- JavaScript (ES6) code snippets
- Live Server
- GitLens
- Prettier - Code formatter

### Debugging
- Python simulation can be debugged using VS Code's Python debugger
- Web interface can be debugged using browser developer tools
- Use `console.log()` for JavaScript debugging

## 🏆 Smart India Hackathon Features

### AI/ML Components
- **Reinforcement Learning**: Q-learning for traffic optimization
- **Computer Vision**: Vehicle detection (YOLOv8 integration planned)
- **Predictive Analytics**: Traffic flow optimization
- **Random Forest Classifier**: Traffic scheduling algorithm selection

### Hardware Integration
- **Arduino**: Traffic light controller prototype
- **Raspberry Pi**: Camera-based vehicle detection
- **IoT Integration**: Real-time sensor data processing

## 📊 Project Components

### Frontend (`frontend/web_sim/`)
- Interactive traffic visualization
- Real-time dashboard
- Canvas-based animation with 12-directional vehicle movements

### Backend (`backend/flask_app/`)
- Pygame traffic simulation
- AI traffic light controller
- Vehicle physics engine

### Machine Learning (`model_training/`)
- Pandas-based data processing
- Scikit-learn traffic pattern analysis
- Predictive scheduling algorithms

### Models (`models/`)
- YOLOv8 vehicle detection
- Trained model checkpoints
- ML model artifacts

### Prototype (`prototype/`)
- Arduino traffic controller
- Raspberry Pi integration
- Hardware interface code

## 🐛 Troubleshooting

### Common Issues

#### Pandas/ML Module Issues:
```bash
# Install required Python packages
pip install pandas scikit-learn numpy
```

#### Pygame Installation Issues:
```bash
# If pygame fails to install, try:
pip install pygame --upgrade
# Or on Linux:
sudo apt install python3-pygame
```

#### Port Already in Use:
```bash
# Kill process using port 5000
sudo lsof -t -i tcp:5000 | xargs kill -9
# Or change port in server.js
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For questions and support, please refer to the documentation in the `docs/` directory or create an issue on the repository.

---
**Smart India Hackathon 2024** | AI-Powered Traffic Management Solution

**Complete Technology Stack**:
- **Languages**: Python, JavaScript, HTML5, CSS3, JSON, Markdown
- **Python Packages**: pandas, scikit-learn, numpy, pygame, flask, opencv-python, tensorflow, pytest
- **Node.js Packages**: express, cors, body-parser, socket.io
- **Web APIs**: Canvas API, Fetch API, Web Workers
- **Tools**: Git, npm, pip, VS Code
