
# Smart Traffic Management Simulation

A comprehensive AI-powered traffic control system developed for the Smart India Hackathon. This project demonstrates intelligent traffic management through real-time vehicle detection, machine learning-based optimization, and dynamic traffic light control using computer vision, reinforcement learning, and web-based visualization.

## 🏗️ System Architecture

- **Frontend**: Canvas-based web simulation with HTML5, CSS3, and JavaScript
- **Backend**: Dual approach with Express.js server and Python Flask application
- **AI Components**: Machine Learning-based traffic prediction with real-time training
- **Hardware Integration**: Arduino and Raspberry Pi support for IoT prototyping

## 📋 Requirements

### Software Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.11 or higher)
- **Git**

### System Dependencies (for Pygame)
- SDL2 development libraries
- Audio and graphics libraries

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
# Create and activate virtual environment (recommended)
python3 -m venv traffic_env
source traffic_env/bin/activate  # On Windows: traffic_env\Scripts\activate

# Install Python packages
pip install -r requirements.txt
```

### 4. Install Node.js Dependencies
```bash
npm install
```

### 5. Project Structure
```
smart-traffic-sim/
├── README.md
├── ABOUT.md
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
│   │   ├── rl_agent.py
│   │   └── schedulers.py
├── model_training/
│   ├── data.csv
│   ├── train_model.py
│   └── predict_scheduling.py
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

### Method 3: Using Package Scripts
```bash
# Start web server only
npm run start

# Start development mode
npm run dev
```

### Method 4: Testing the Scheduling System
```bash
# Run the scheduling algorithm tests
cd backend/flask_app
python -m pytest ../../tests/test_schedulers.py -v

# Test individual scheduling algorithms
python -c "
from schedulers import TrafficScheduler, IntersectionState, SchedulingPolicy
scheduler = TrafficScheduler()
state = IntersectionState(
    queues={'N': 5, 'E': 3, 'S': 2, 'W': 4},
    waiting_times={'N': [10,15,20,25,30], 'E': [5,8,12], 'S': [7,9], 'W': [18,22,25,28]},
    arrival_rates={'N': 0.1, 'E': 0.05, 'S': 0.03, 'W': 0.08},
    emergency=[], current_phase='NS_green', sim_time=100.0
)
plan = scheduler.schedule(state, SchedulingPolicy.META)
print('Generated schedule:', [f'{p.phase}: {p.duration}s' for p in plan])
"
```

## 🎯 Usage Instructions

### Web Interface
1. Open your browser and navigate to `http://localhost:5000`
2. Use the interactive dashboard to:
   - Monitor real-time traffic data
   - View intersection statistics
   - Control simulation parameters
   - Select time periods for Indian traffic patterns

### Pygame Simulation Controls
- **5-8**: Spawn emergency vehicle from specific direction (N/E/S/W)
- **1-4**: Spawn vehicle in specific lane (North, East, South, West)
- **ESC**: Exit simulation

### Features
- **Dynamic Traffic Lights**: AI-controlled timing based on vehicle density
- **Emergency Vehicle Priority**: Automatic green light for emergency vehicles
- **Real-time Statistics**: Vehicle count, wait times, and flow metrics
- **Multi-lane Intersection**: 4-way crossroad simulation
- **Machine Learning Integration**: Predictive traffic optimization
- **Time-based Traffic Patterns**: Indian traffic condition simulation
- **Accident Detection & Prevention**: Real collision handling
- **Rule Violation Monitoring**: Safety compliance tracking

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
- **Machine Learning**: Real-time traffic prediction and optimization
- **Computer Vision**: Vehicle detection (YOLOv8 integration)
- **Predictive Analytics**: Traffic flow optimization with auto-retraining
- **Reinforcement Learning**: Q-learning for traffic optimization

### Hardware Integration
- **Arduino**: Traffic light controller prototype
- **Raspberry Pi**: Camera-based vehicle detection
- **IoT Integration**: Real-time sensor data processing

## 📊 Programming Languages & Technologies Used

### **Core Languages**
- **Python** (v3.11+) - Backend simulation, ML models, data processing
- **JavaScript** (ES6+) - Frontend simulation, real-time interactions
- **HTML5** - Web interface structure and Canvas API
- **CSS3** - Responsive design and animations
- **C++** (Arduino) - Hardware controller programming

### **Frontend Technologies**
- **HTML5 Canvas API** - Real-time traffic visualization
- **CSS Grid & Flexbox** - Responsive layout design
- **JavaScript ES6 Modules** - Modular code organization
- **Web APIs** - Local storage, keyboard events, animation frames

### **Backend Technologies**
- **Node.js & Express.js** - Web server and API endpoints
- **Python Flask** - Alternative backend server
- **Socket.IO** - Real-time bidirectional communication
- **RESTful APIs** - Data exchange between components

### **Python Libraries & Frameworks**
- **pygame** (v2.6.1) - Traffic simulation engine
- **flask** (v3.0.0) - Web framework
- **numpy** (v1.24.3) - Numerical computations
- **pandas** (v2.0.3) - Data manipulation and analysis
- **scikit-learn** (v1.3.0) - Machine learning algorithms
- **opencv-python** (v4.8.0) - Computer vision processing
- **matplotlib** (v3.7.2) - Data visualization
- **pytest** (v7.4.0) - Testing framework

### **JavaScript Libraries & Packages**
- **express** (v4.18.2) - Web application framework
- **socket.io** (v4.7.2) - Real-time communication
- **nodemon** (v3.0.1) - Development server auto-restart
- **cors** (v2.8.5) - Cross-origin resource sharing

### **Machine Learning & AI**
- **Supervised Learning** - Traffic pattern prediction
- **Time Series Analysis** - Traffic flow forecasting
- **Decision Trees & Random Forest** - Scheduling optimization
- **Linear Regression** - Vehicle count prediction
- **Feature Engineering** - Traffic data preprocessing

### **Hardware & IoT**
- **Arduino IDE & C++** - Microcontroller programming
- **Raspberry Pi OS** - Edge computing platform
- **OpenCV** - Real-time image processing
- **GPIO Programming** - Hardware interface control

### **Development Tools**
- **Git** - Version control system
- **VS Code** - Integrated development environment
- **npm** - Package management
- **pip** - Python package installer
- **pytest** - Automated testing

### **Data Storage & Processing**
- **CSV Files** - Training data storage
- **JSON** - Configuration and API data
- **Real-time Streaming** - Live data processing
- **File I/O Operations** - Data persistence

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
**Smart India Hackathon 2025** | AI-Powered Traffic Management Solution with Machine Learning Integration
