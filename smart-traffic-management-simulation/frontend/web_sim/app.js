class TrafficSimulation {
    constructor() {
        this.isRunning = false;
        this.animationId = null;
        this.canvas = document.getElementById('trafficCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Canvas settings
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        // Intersection settings
        this.centerX = this.canvasWidth / 2;
        this.centerY = this.canvasHeight / 2;
        this.roadWidth = 120;
        this.laneWidth = 30;

        // Simulation state
        this.vehicles = [];
        this.emergencyVehicles = [];
        this.lastSpawnTime = 0;
        this.lastEmergencySpawn = 0;
        this.spawnRate = 2000; // milliseconds between spawns
        this.emergencyRate = 15000; // emergency vehicle every 15 seconds

        // Traffic light system
        this.trafficLights = [
            { direction: 'North', x: this.centerX - 15, y: this.centerY - 80, state: 'red', timer: 0, carCount: 0 },
            { direction: 'East', x: this.centerX + 80, y: this.centerY - 15, state: 'red', timer: 0, carCount: 0 },
            { direction: 'South', x: this.centerX + 15, y: this.centerY + 80, state: 'red', timer: 0, carCount: 0 },
            { direction: 'West', x: this.centerX - 80, y: this.centerY + 15, state: 'red', timer: 0, carCount: 0 }
        ];

        this.currentGreenIndex = 0;
        this.trafficLights[0].state = 'green';
        this.lightChangeTime = 0;
        this.yellowTime = 2000;
        this.minGreenTime = 4000;
        this.maxGreenTime = 10000;

        // Stats
        this.stats = {
            totalVehicles: 0,
            vehiclesPassed: 0,
            emergencyVehicles: 0,
            currentWaiting: 0
        };

        this.initializeEventListeners();
        this.addLog('🚦 Smart Traffic Management System Ready!');
    }

    initializeEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startSimulation());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopSimulation());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetSimulation());

        // Manual controls
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            switch(e.key.toLowerCase()) {
                case '1':
                    this.spawnVehicle(0); // North
                    break;
                case '2':
                    this.spawnVehicle(1); // East
                    break;
                case '3':
                    this.spawnVehicle(2); // South
                    break;
                case '4':
                    this.spawnVehicle(3); // West
                    break;
                case '5':
                    this.spawnEmergencyVehicle(0); // Emergency from North
                    break;
                case '6':
                    this.spawnEmergencyVehicle(1); // Emergency from East
                    break;
                case '7':
                    this.spawnEmergencyVehicle(2); // Emergency from South
                    break;
                case '8':
                    this.spawnEmergencyVehicle(3); // Emergency from West
                    break;
            }
        });
    }

    spawnVehicle(direction) {
        const directions = ['North', 'East', 'South', 'West'];
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];

        let startX, startY, targetX, targetY, angle;

        switch(direction) {
            case 0: // North (coming from south)
                startX = this.centerX - 15;
                startY = this.canvasHeight + this.findSafeSpawnPosition(direction);
                targetX = this.centerX - 15;
                targetY = -30;
                angle = -Math.PI / 2;
                break;
            case 1: // East (coming from west)
                startX = -30 - this.findSafeSpawnPosition(direction);
                startY = this.centerY - 15;
                targetX = this.canvasWidth + 30;
                targetY = this.centerY - 15;
                angle = 0;
                break;
            case 2: // South (coming from north)
                startX = this.centerX + 15;
                startY = -30 - this.findSafeSpawnPosition(direction);
                targetX = this.centerX + 15;
                targetY = this.canvasHeight + 30;
                angle = Math.PI / 2;
                break;
            case 3: // West (coming from east)
                startX = this.canvasWidth + 30 + this.findSafeSpawnPosition(direction);
                startY = this.centerY + 15;
                targetX = -30;
                targetY = this.centerY + 15;
                angle = Math.PI;
                break;
        }

        const vehicle = {
            x: startX,
            y: startY,
            targetX: targetX,
            targetY: targetY,
            direction: direction,
            directionName: directions[direction],
            speed: 1.5 + Math.random() * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            width: 20,
            height: 12,
            angle: angle,
            stopped: false,
            isEmergency: false,
            id: Math.random().toString(36).substr(2, 9)
        };

        this.vehicles.push(vehicle);
        this.stats.totalVehicles++;
        this.updateStats();
    }

    spawnEmergencyVehicle(direction = null) {
        // If no direction specified, choose random
        if (direction === null) {
            direction = Math.floor(Math.random() * 4);
        }
        
        this.spawnVehicle(direction);

        // Convert last spawned vehicle to emergency
        const lastVehicle = this.vehicles[this.vehicles.length - 1];
        lastVehicle.isEmergency = true;
        lastVehicle.color = '#ff0000';
        lastVehicle.speed *= 1.3;

        this.stats.emergencyVehicles++;
        this.addLog(`🚨 Emergency vehicle approaching from ${lastVehicle.directionName}!`, 'warning');
        this.updateStats();
    }

    updateTrafficLights(deltaTime) {
        // Count vehicles waiting at each direction
        this.trafficLights.forEach((light, index) => {
            light.carCount = this.countVehiclesWaiting(index);
        });

        // Check for emergency vehicles
        const emergencyDirection = this.checkEmergencyVehicles();
        if (emergencyDirection !== -1 && this.currentGreenIndex !== emergencyDirection) {
            this.addLog(`🚨 Emergency override: switching to ${this.trafficLights[emergencyDirection].direction}`, 'warning');
            this.switchLight(emergencyDirection);
            return;
        }

        // Update current light timer
        this.lightChangeTime += deltaTime;

        // Dynamic green time based on vehicle count
        const currentLight = this.trafficLights[this.currentGreenIndex];
        let greenDuration = this.minGreenTime + (currentLight.carCount * 1000);
        greenDuration = Math.min(greenDuration, this.maxGreenTime);

        // Check if we should switch to yellow
        if (currentLight.state === 'green' && this.lightChangeTime >= greenDuration) {
            currentLight.state = 'yellow';
            currentLight.timer = 0;
            this.addLog(`💛 ${currentLight.direction} switching to yellow`);
        }

        // Check if we should switch to next direction
        if (currentLight.state === 'yellow') {
            currentLight.timer += deltaTime;
            if (currentLight.timer >= this.yellowTime) {
                this.switchToNextDirection();
            }
        }
    }

    countVehiclesWaiting(direction) {
        let count = 0;
        this.vehicles.forEach(vehicle => {
            if (vehicle.direction === direction && vehicle.stopped) {
                count++;
            }
        });
        return count;
    }

    checkEmergencyVehicles() {
        for (let vehicle of this.vehicles) {
            if (vehicle.isEmergency && this.isVehicleNearIntersection(vehicle)) {
                return vehicle.direction;
            }
        }
        return -1;
    }

    isVehicleNearIntersection(vehicle) {
        const distance = Math.sqrt(
            Math.pow(vehicle.x - this.centerX, 2) + 
            Math.pow(vehicle.y - this.centerY, 2)
        );
        return distance < 100;
    }

    switchLight(newDirection) {
        // Set all lights to red
        this.trafficLights.forEach(light => light.state = 'red');

        // Set new direction to green
        this.trafficLights[newDirection].state = 'green';
        this.currentGreenIndex = newDirection;
        this.lightChangeTime = 0;

        this.addLog(`💚 ${this.trafficLights[newDirection].direction} light is now GREEN`);
    }

    switchToNextDirection() {
        this.trafficLights[this.currentGreenIndex].state = 'red';

        // Find next direction with most vehicles or cycle through
        let nextDirection = (this.currentGreenIndex + 1) % 4;
        let maxCars = 0;
        let bestDirection = nextDirection;

        for (let i = 0; i < 4; i++) {
            if (this.trafficLights[i].carCount > maxCars) {
                maxCars = this.trafficLights[i].carCount;
                bestDirection = i;
            }
        }

        // Use best direction if it has waiting vehicles, otherwise cycle
        this.currentGreenIndex = maxCars > 0 ? bestDirection : nextDirection;
        this.trafficLights[this.currentGreenIndex].state = 'green';
        this.lightChangeTime = 0;

        this.addLog(`💚 Switched to ${this.trafficLights[this.currentGreenIndex].direction} (${maxCars} vehicles waiting)`);
    }

    updateVehicles(deltaTime) {
        // Use reverse iteration to safely remove vehicles
        for (let i = this.vehicles.length - 1; i >= 0; i--) {
            const vehicle = this.vehicles[i];

            // Check if vehicle should stop at red light
            const light = this.trafficLights[vehicle.direction];
            const shouldStop = this.shouldVehicleStop(vehicle, light);

            vehicle.stopped = shouldStop;

            if (!shouldStop) {
                // Move vehicle
                const dx = vehicle.targetX - vehicle.x;
                const dy = vehicle.targetY - vehicle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 5) {
                    vehicle.x += (dx / distance) * vehicle.speed;
                    vehicle.y += (dy / distance) * vehicle.speed;
                } else {
                    // Vehicle has reached destination - safe to remove
                    this.vehicles.splice(i, 1);
                    this.stats.vehiclesPassed++;
                }
            }
        }

        // Update waiting count
        this.stats.currentWaiting = this.vehicles.filter(v => v.stopped).length;
        this.updateStats();
    }

    shouldVehicleStop(vehicle, light) {
        if (light.state === 'green') return false;
        if (vehicle.isEmergency) return false; // Emergency vehicles don't stop

        // Check if vehicle is approaching intersection
        let stopLine;
        switch (vehicle.direction) {
            case 0: // North
                stopLine = this.centerY + 40;
                return vehicle.y > stopLine && vehicle.y < stopLine + 80;
            case 1: // East
                stopLine = this.centerX - 40;
                return vehicle.x < stopLine && vehicle.x > stopLine - 80;
            case 2: // South
                stopLine = this.centerY - 40;
                return vehicle.y < stopLine && vehicle.y > stopLine - 80;
            case 3: // West
                stopLine = this.centerX + 40;
                return vehicle.x > stopLine && vehicle.x < stopLine + 80;
        }
        return false;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Draw roads
        this.drawRoads();

        // Draw traffic lights
        this.drawTrafficLights();

        // Draw vehicles
        this.drawVehicles();

        // Draw UI elements
        this.drawUI();
    }

    drawRoads() {
        this.ctx.fillStyle = '#34495e';

        // Horizontal road
        this.ctx.fillRect(0, this.centerY - this.roadWidth/2, this.canvasWidth, this.roadWidth);

        // Vertical road
        this.ctx.fillRect(this.centerX - this.roadWidth/2, 0, this.roadWidth, this.canvasHeight);

        // Draw lane markings
        this.ctx.strokeStyle = '#f39c12';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);

        // Horizontal lane divider
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.centerY);
        this.ctx.lineTo(this.canvasWidth, this.centerY);
        this.ctx.stroke();

        // Vertical lane divider
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, 0);
        this.ctx.lineTo(this.centerX, this.canvasHeight);
        this.ctx.stroke();

        this.ctx.setLineDash([]); // Reset line dash

        // Draw intersection
        this.ctx.fillStyle = '#95a5a6';
        this.ctx.fillRect(
            this.centerX - this.roadWidth/2, 
            this.centerY - this.roadWidth/2, 
            this.roadWidth, 
            this.roadWidth
        );
    }

    drawTrafficLights() {
        this.trafficLights.forEach((light, index) => {
            // Traffic light pole
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(light.x - 5, light.y - 30, 10, 60);

            // Traffic light box
            this.ctx.fillStyle = '#34495e';
            this.ctx.fillRect(light.x - 12, light.y - 18, 24, 36);

            // Light circles
            const lightColors = {
                'red': '#e74c3c',
                'yellow': '#f1c40f',
                'green': '#2ecc71'
            };

            // Red light
            this.ctx.fillStyle = light.state === 'red' ? lightColors.red : '#7f8c8d';
            this.ctx.beginPath();
            this.ctx.arc(light.x, light.y - 10, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Yellow light
            this.ctx.fillStyle = light.state === 'yellow' ? lightColors.yellow : '#7f8c8d';
            this.ctx.beginPath();
            this.ctx.arc(light.x, light.y, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Green light
            this.ctx.fillStyle = light.state === 'green' ? lightColors.green : '#7f8c8d';
            this.ctx.beginPath();
            this.ctx.arc(light.x, light.y + 10, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Highlight current green light with glow effect
            if (light.state === 'green') {
                this.ctx.shadowColor = '#2ecc71';
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.arc(light.x, light.y + 10, 8, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#2ecc71';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }

            // Timer display
            this.drawTimer(light, index);

            // Direction label with improved styling - moved higher to avoid timer collision
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(light.direction.toUpperCase(), light.x, light.y - 65);
            this.ctx.fillText(light.direction.toUpperCase(), light.x, light.y - 65);

            // Vehicle count
            this.ctx.fillStyle = '#3498db';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`🚗 ${light.carCount}`, light.x, light.y + 35);
        });
    }

    drawTimer(light, index) {
        let timeRemaining;
        if (light.state === 'green') {
            const greenDuration = this.minGreenTime + (light.carCount * 1000);
            timeRemaining = Math.max(0, greenDuration - this.lightChangeTime);
        } else if (light.state === 'yellow') {
            timeRemaining = Math.max(0, this.yellowTime - light.timer);
        } else {
            timeRemaining = 0;
        }

        const seconds = Math.ceil(timeRemaining / 1000);

        // Timer background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(light.x - 15, light.y - 50, 30, 15);

        // Timer text
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${seconds}s`, light.x, light.y - 40);
    }

    drawVehicles() {
        this.vehicles.forEach(vehicle => {
            this.ctx.save();
            this.ctx.translate(vehicle.x, vehicle.y);
            this.ctx.rotate(vehicle.angle);

            // Vehicle body
            this.ctx.fillStyle = vehicle.color;
            this.ctx.fillRect(-vehicle.width/2, -vehicle.height/2, vehicle.width, vehicle.height);

            // Vehicle border
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(-vehicle.width/2, -vehicle.height/2, vehicle.width, vehicle.height);

            // Emergency vehicle effects
            if (vehicle.isEmergency) {
                // Flashing lights
                const flash = Math.floor(Date.now() / 200) % 2;
                this.ctx.fillStyle = flash ? '#ff0000' : '#0000ff';
                this.ctx.fillRect(-vehicle.width/2 - 2, -vehicle.height/2 - 2, 4, 4);
                this.ctx.fillRect(vehicle.width/2 - 2, -vehicle.height/2 - 2, 4, 4);

                // Emergency label
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 8px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('EMG', 0, 2);
            }

            this.ctx.restore();
        });
    }

    drawUI() {
        // Current green indicator
        const currentLight = this.trafficLights[this.currentGreenIndex];
        this.ctx.fillStyle = 'rgba(46, 204, 113, 0.9)';
        this.ctx.fillRect(10, 10, 200, 40);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`🟢 GREEN: ${currentLight.direction}`, 20, 35);

        // Instructions
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, this.canvasHeight - 80, 300, 70);
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Controls:', 20, this.canvasHeight - 60);
        this.ctx.fillText('5-8 - Emergency Vehicle (N/E/S/W)', 20, this.canvasHeight - 45);
        this.ctx.fillText('1-4 - Spawn Vehicle (N/E/S/W)', 20, this.canvasHeight - 30);
        this.ctx.fillText('Auto-spawn enabled during simulation', 20, this.canvasHeight - 15);
    }

    updateStats() {
        document.getElementById('totalVehicles').textContent = this.stats.totalVehicles;
        document.getElementById('avgWaitTime').textContent = `${this.stats.currentWaiting}`;
        document.getElementById('congestedAreas').textContent = this.stats.emergencyVehicles;

        // Update additional stats in intersections area
        const container = document.getElementById('intersections');
        container.innerHTML = `
            <div class="stat-summary">
                <h3>🚦 Live Traffic Status</h3>
                <div class="traffic-stats">
                    <div class="stat-item">
                        <span class="stat-label">Vehicles Passed:</span>
                        <span class="stat-value">${this.stats.vehiclesPassed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Currently Waiting:</span>
                        <span class="stat-value">${this.stats.currentWaiting}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Emergency Calls:</span>
                        <span class="stat-value">${this.stats.emergencyVehicles}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Active Green:</span>
                        <span class="stat-value green-indicator">${this.trafficLights[this.currentGreenIndex].direction}</span>
                    </div>
                </div>
            </div>
        `;
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - (this.lastTime || currentTime);
        this.lastTime = currentTime;

        // Auto-spawn vehicles
        if (currentTime - this.lastSpawnTime > this.spawnRate) {
            const direction = Math.floor(Math.random() * 4);
            this.spawnVehicle(direction);
            this.lastSpawnTime = currentTime;
        }

        // Auto-spawn emergency vehicles
        if (currentTime - this.lastEmergencySpawn > this.emergencyRate) {
            this.spawnEmergencyVehicle();
            this.lastEmergencySpawn = currentTime;
        }

        // Update simulation
        this.updateTrafficLights(deltaTime);
        this.updateVehicles(deltaTime);

        // Draw everything
        this.draw();

        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    startSimulation() {
        if (this.isRunning) return;

        this.isRunning = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;

        this.addLog('🚀 Starting smart traffic simulation...', 'success');
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    stopSimulation() {
        if (!this.isRunning) return;

        this.isRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.addLog('⏹️ Traffic simulation stopped', 'info');
    }

    resetSimulation() {
        this.stopSimulation();

        // Reset all state
        this.vehicles = [];
        this.emergencyVehicles = [];
        this.stats = {
            totalVehicles: 0,
            vehiclesPassed: 0,
            emergencyVehicles: 0,
            currentWaiting: 0
        };

        // Reset traffic lights
        this.trafficLights.forEach((light, index) => {
            light.state = index === 0 ? 'green' : 'red';
            light.timer = 0;
            light.carCount = 0;
        });
        this.currentGreenIndex = 0;
        this.lightChangeTime = 0;

        this.updateStats();
        this.draw();

        document.getElementById('logContainer').innerHTML = '';
        this.addLog('🔄 System reset completed', 'success');
    }

    addLog(message, type = 'info') {
        const logContainer = document.getElementById('logContainer');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('p');

        let prefix = '';
        switch (type) {
            case 'error':
                prefix = '❌';
                break;
            case 'warning':
                prefix = '⚠️';
                break;
            case 'success':
                prefix = '✅';
                break;
            default:
                prefix = 'ℹ️';
        }

        logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${prefix} ${message}`;
        logEntry.className = `log-entry log-${type}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // Keep only last 15 log entries
        while (logContainer.children.length > 15) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }

    findSafeSpawnPosition(direction) {
        const vehiclesInDirection = this.vehicles.filter(v => v.direction === direction);
        if (vehiclesInDirection.length === 0) return 0;

        // Find the furthest vehicle in spawn area
        let maxOffset = 0;
        for (let vehicle of vehiclesInDirection) {
            let offset = 0;
            switch (direction) {
                case 0: // North
                    if (vehicle.y > this.canvasHeight) {
                        offset = vehicle.y - this.canvasHeight;
                    }
                    break;
                case 1: // East
                    if (vehicle.x < 0) {
                        offset = Math.abs(vehicle.x);
                    }
                    break;
                case 2: // South
                    if (vehicle.y < 0) {
                        offset = Math.abs(vehicle.y);
                    }
                    break;
                case 3: // West
                    if (vehicle.x > this.canvasWidth) {
                        offset = vehicle.x - this.canvasWidth;
                    }
                    break;
            }
            maxOffset = Math.max(maxOffset, offset);
        }

        return maxOffset + 35; // Add safe distance
    }
}

// Initialize the simulation when page loads
document.addEventListener('DOMContentLoaded', () => {
    const simulation = new TrafficSimulation();
    simulation.draw(); // Initial draw
});