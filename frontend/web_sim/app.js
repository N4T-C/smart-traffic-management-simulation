
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

        // ML Integration
        this.lastDataLogTime = 0;
        this.dataLogInterval = 5000; // Log every 5 seconds
        this.lastTrainingTime = 0;
        this.trainingInterval = 5000; // Train every 5 seconds
        this.lastPredictionTime = 0;
        this.predictionInterval = 10000; // Predict every 10 seconds
        this.currentPredictedScheduling = 'Round Robin';
        this.availableSchedulingMethods = ['Round Robin', 'Priority Scheduling', 'Shortest Job First'];

        // Rule violations and accident handling
        this.ruleViolations = [];
        this.accidents = [];
        this.safetyDistanceThreshold = 25;
        this.speedLimit = 3.0;
        this.redLightViolations = 0;
        this.speedingViolations = 0;
        this.accidentCount = 0;

        // Traffic light system with ML enhancement
        this.trafficLights = [
            { direction: 'North', x: this.centerX - 15, y: this.centerY - 80, state: 'red', timer: 0, carCount: 0, mlWeight: 1.0 },
            { direction: 'East', x: this.centerX + 80, y: this.centerY - 15, state: 'red', timer: 0, carCount: 0, mlWeight: 1.0 },
            { direction: 'South', x: this.centerX + 15, y: this.centerY + 80, state: 'red', timer: 0, carCount: 0, mlWeight: 1.0 },
            { direction: 'West', x: this.centerX - 80, y: this.centerY + 15, state: 'red', timer: 0, carCount: 0, mlWeight: 1.0 }
        ];

        this.currentGreenIndex = 0;
        this.trafficLights[0].state = 'green';
        this.lightChangeTime = 0;
        this.yellowTime = 2000;
        this.minGreenTime = 4000;
        this.maxGreenTime = 10000;

        // Enhanced stats with ML metrics
        this.stats = {
            totalVehicles: 0,
            vehiclesPassed: 0,
            emergencyVehicles: 0,
            currentWaiting: 0,
            ruleViolations: 0,
            accidents: 0,
            mlPredictions: 0,
            averageWaitTime: 0,
            trafficEfficiency: 100
        };

        this.initializeEventListeners();
        this.addLog('🚦 Smart Traffic Management System with AI Ready!');
        this.addLog('🤖 ML Model integration active - training every 5 seconds');
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

    spawnVehicle(direction, movement = 'straight') {
        const directions = ['North', 'East', 'South', 'West'];
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
        const movements = ['straight', 'left', 'right'];

        // Check for safe spawning position to prevent immediate collisions
        const safePosition = this.findSafeSpawnPosition(direction);
        if (!safePosition.safe) {
            this.addLog(`⚠️ Cannot spawn vehicle - unsafe conditions in ${directions[direction]}`, 'warning');
            return;
        }

        // If no movement specified, randomly choose one
        if (movement === 'random') {
            movement = movements[Math.floor(Math.random() * movements.length)];
        }

        let startX, startY, targetX, targetY, angle;

        switch(direction) {
            case 0: // North (coming from south)
                startX = this.centerX - 15;
                startY = this.canvasHeight + safePosition.offset;
                angle = -Math.PI / 2;
                
                if (movement === 'straight') { // North to South
                    targetX = this.centerX - 15;
                    targetY = -30;
                } else if (movement === 'right') { // North to East
                    targetX = this.canvasWidth + 30;
                    targetY = this.centerY - 15;
                } else { // North to West
                    targetX = -30;
                    targetY = this.centerY + 15;
                }
                break;
            case 1: // East (coming from west)
                startX = -30 - safePosition.offset;
                startY = this.centerY - 15;
                angle = 0;
                
                if (movement === 'straight') { // East to West
                    targetX = this.canvasWidth + 30;
                    targetY = this.centerY - 15;
                } else if (movement === 'right') { // East to South
                    targetX = this.centerX + 15;
                    targetY = this.canvasHeight + 30;
                } else { // East to North
                    targetX = this.centerX - 15;
                    targetY = -30;
                }
                break;
            case 2: // South (coming from north)
                startX = this.centerX + 15;
                startY = -30 - safePosition.offset;
                angle = Math.PI / 2;
                
                if (movement === 'straight') { // South to North
                    targetX = this.centerX + 15;
                    targetY = this.canvasHeight + 30;
                } else if (movement === 'right') { // South to West
                    targetX = -30;
                    targetY = this.centerY + 15;
                } else { // South to East
                    targetX = this.canvasWidth + 30;
                    targetY = this.centerY - 15;
                }
                break;
            case 3: // West (coming from east)
                startX = this.canvasWidth + 30 + safePosition.offset;
                startY = this.centerY + 15;
                angle = Math.PI;
                
                if (movement === 'straight') { // West to East
                    targetX = -30;
                    targetY = this.centerY + 15;
                } else if (movement === 'right') { // West to North
                    targetX = this.centerX - 15;
                    targetY = -30;
                } else { // West to South
                    targetX = this.centerX + 15;
                    targetY = this.canvasHeight + 30;
                }
                break;
        }

        const vehicle = {
            x: startX,
            y: startY,
            targetX: targetX,
            targetY: targetY,
            direction: direction,
            directionName: directions[direction],
            movement: movement,
            speed: Math.max(0.5, Math.min(this.speedLimit, 1.5 + Math.random() * 0.5)),
            originalSpeed: 1.5 + Math.random() * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            width: 20,
            height: 12,
            angle: angle,
            stopped: false,
            isEmergency: false,
            id: Math.random().toString(36).substr(2, 9),
            waitTime: 0,
            hasViolatedRules: false
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
        if (lastVehicle) {
            lastVehicle.isEmergency = true;
            lastVehicle.color = '#ff0000';
            lastVehicle.speed = Math.min(this.speedLimit * 1.3, lastVehicle.speed * 1.3);

            this.stats.emergencyVehicles++;
            this.addLog(`🚨 Emergency vehicle approaching from ${lastVehicle.directionName}!`, 'warning');
        }
        this.updateStats();
    }

    // ML Integration Functions
    async logDataToCSV(currentTime) {
        if (currentTime - this.lastDataLogTime >= this.dataLogInterval) {
            const timestamp = new Date().toISOString();
            const carsPresent = this.vehicles.length;
            const emergencyVehicle = this.vehicles.some(v => v.isEmergency) ? 1 : 0;
            
            // Determine current scheduling model based on traffic conditions
            let schedulingModel = this.determineCurrentSchedulingModel();
            
            // Log data
            try {
                const response = await fetch('/api/log-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        timestamp: timestamp,
                        cars_present: carsPresent,
                        emergency_vehicle: emergencyVehicle,
                        scheduling_model: schedulingModel
                    })
                });

                if (response.ok) {
                    this.addLog(`📊 Data logged: ${carsPresent} cars, Emergency: ${emergencyVehicle ? 'Yes' : 'No'}, Model: ${schedulingModel}`);
                } else {
                    this.addLog('⚠️ Failed to log data to CSV', 'warning');
                }
            } catch (error) {
                this.addLog(`❌ Error logging data: ${error.message}`, 'error');
            }

            this.lastDataLogTime = currentTime;
        }
    }

    async trainMLModel(currentTime) {
        if (currentTime - this.lastTrainingTime >= this.trainingInterval) {
            try {
                this.addLog('🔄 Training ML model with latest data...');
                const response = await fetch('/api/train-model', {
                    method: 'POST'
                });

                if (response.ok) {
                    const result = await response.json();
                    this.addLog(`✅ Model training completed: ${result.message}`);
                } else {
                    this.addLog('⚠️ Model training failed', 'warning');
                }
            } catch (error) {
                this.addLog(`❌ Error training model: ${error.message}`, 'error');
            }

            this.lastTrainingTime = currentTime;
        }
    }

    async getPrediction(currentTime) {
        if (currentTime - this.lastPredictionTime >= this.predictionInterval) {
            try {
                const timestamp = new Date(Date.now() + 10000).toISOString(); // 10 seconds ahead
                const carsPresent = this.vehicles.length + Math.floor(Math.random() * 5); // Predict future traffic
                const emergencyVehicle = Math.random() < 0.1 ? 1 : 0; // 10% chance of emergency

                const response = await fetch('/api/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        timestamp: timestamp,
                        cars_present: carsPresent,
                        emergency_vehicle: emergencyVehicle
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    this.currentPredictedScheduling = result.scheduling_model;
                    this.stats.mlPredictions++;
                    this.addLog(`🔮 ML Prediction: ${result.scheduling_model} (${carsPresent} cars predicted)`);
                } else {
                    this.addLog('⚠️ Prediction request failed', 'warning');
                }
            } catch (error) {
                this.addLog(`❌ Error getting prediction: ${error.message}`, 'error');
            }

            this.lastPredictionTime = currentTime;
        }
    }

    determineCurrentSchedulingModel() {
        const totalVehicles = this.vehicles.length;
        const emergencyPresent = this.vehicles.some(v => v.isEmergency);
        const queueVariance = this.calculateQueueVariance();

        if (emergencyPresent) {
            return 'Priority Scheduling';
        } else if (totalVehicles < 5) {
            return 'Round Robin';
        } else if (queueVariance > 3) {
            return 'Shortest Job First';
        } else {
            return 'Priority Scheduling';
        }
    }

    calculateQueueVariance() {
        const queues = this.trafficLights.map(light => light.carCount);
        const mean = queues.reduce((sum, q) => sum + q, 0) / queues.length;
        const variance = queues.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / queues.length;
        return variance;
    }

    // Rule Violation Detection
    detectRuleViolations() {
        this.vehicles.forEach(vehicle => {
            // Speed limit violations
            if (vehicle.speed > this.speedLimit && !vehicle.hasViolatedRules) {
                this.speedingViolations++;
                this.stats.ruleViolations++;
                vehicle.hasViolatedRules = true;
                this.ruleViolations.push({
                    type: 'SPEEDING',
                    vehicleId: vehicle.id,
                    speed: vehicle.speed,
                    limit: this.speedLimit,
                    timestamp: Date.now(),
                    direction: vehicle.directionName
                });
                this.addLog(`🚔 VIOLATION: Vehicle ${vehicle.id.substring(0, 6)} speeding at ${vehicle.speed.toFixed(1)} in ${vehicle.directionName}`, 'warning');
            }

            // Red light violations
            const light = this.trafficLights[vehicle.direction];
            if (light.state === 'red' && this.isVehicleInIntersection(vehicle) && !vehicle.isEmergency && !vehicle.hasViolatedRules) {
                this.redLightViolations++;
                this.stats.ruleViolations++;
                vehicle.hasViolatedRules = true;
                this.ruleViolations.push({
                    type: 'RED_LIGHT_VIOLATION',
                    vehicleId: vehicle.id,
                    timestamp: Date.now(),
                    direction: vehicle.directionName
                });
                this.addLog(`🚨 VIOLATION: Vehicle ${vehicle.id.substring(0, 6)} ran red light from ${vehicle.directionName}`, 'error');
            }
        });
    }

    // Accident Detection and Prevention
    detectAndPreventAccidents() {
        for (let i = 0; i < this.vehicles.length; i++) {
            for (let j = i + 1; j < this.vehicles.length; j++) {
                const vehicle1 = this.vehicles[i];
                const vehicle2 = this.vehicles[j];

                const distance = Math.sqrt(
                    Math.pow(vehicle1.x - vehicle2.x, 2) + 
                    Math.pow(vehicle1.y - vehicle2.y, 2)
                );

                // Collision detection
                if (distance < this.safetyDistanceThreshold) {
                    // Emergency braking
                    vehicle1.speed = Math.max(0.1, vehicle1.speed * 0.3);
                    vehicle2.speed = Math.max(0.1, vehicle2.speed * 0.3);

                    // Check for actual collision
                    if (distance < 15) {
                        this.handleAccident(vehicle1, vehicle2);
                    }
                }

                // Prevent rear-end collisions in same direction
                if (this.isSameDirection(vehicle1, vehicle2) && this.isVehicleAhead(vehicle1, vehicle2)) {
                    if (distance < this.safetyDistanceThreshold + 10) {
                        vehicle2.speed = Math.max(0.1, vehicle1.speed * 0.8); // Following vehicle slows down
                    }
                }
            }
        }
    }

    handleAccident(vehicle1, vehicle2) {
        this.accidentCount++;
        this.stats.accidents++;
        
        const accident = {
            id: Math.random().toString(36).substr(2, 9),
            vehicles: [vehicle1.id, vehicle2.id],
            location: { x: (vehicle1.x + vehicle2.x) / 2, y: (vehicle1.y + vehicle2.y) / 2 },
            timestamp: Date.now(),
            directions: [vehicle1.directionName, vehicle2.directionName]
        };

        this.accidents.push(accident);

        // Stop vehicles involved in accident
        vehicle1.speed = 0;
        vehicle2.speed = 0;
        vehicle1.color = '#8B0000'; // Dark red for accident
        vehicle2.color = '#8B0000';

        // Emergency response - clear the intersection
        this.addLog(`💥 ACCIDENT: Vehicles collided at intersection! Emergency response activated`, 'error');
        this.addLog(`🚨 Accident involves vehicles from ${vehicle1.directionName} and ${vehicle2.directionName}`, 'error');

        // Clear traffic lights to red for safety
        this.trafficLights.forEach(light => {
            light.state = 'red';
        });

        // Schedule emergency clearing
        setTimeout(() => {
            this.clearAccidentVehicles(accident.id);
        }, 400); // Clear after 0.4 seconds
    }

    clearAccidentVehicles(accidentId) {
        const accident = this.accidents.find(acc => acc.id === accidentId);
        if (accident) {
            // Remove accident vehicles
            this.vehicles = this.vehicles.filter(vehicle => 
                !accident.vehicles.includes(vehicle.id)
            );

            this.addLog(`🚑 Accident cleared - normal traffic flow resuming`, 'success');
            
            // Resume normal traffic light operation
            this.trafficLights[this.currentGreenIndex].state = 'green';
        }
    }

    isVehicleInIntersection(vehicle) {
        const intersectionBounds = {
            minX: this.centerX - this.roadWidth / 2,
            maxX: this.centerX + this.roadWidth / 2,
            minY: this.centerY - this.roadWidth / 2,
            maxY: this.centerY + this.roadWidth / 2
        };

        return vehicle.x >= intersectionBounds.minX && 
               vehicle.x <= intersectionBounds.maxX &&
               vehicle.y >= intersectionBounds.minY && 
               vehicle.y <= intersectionBounds.maxY;
    }

    isSameDirection(vehicle1, vehicle2) {
        return vehicle1.direction === vehicle2.direction;
    }

    isVehicleAhead(vehicle1, vehicle2) {
        switch (vehicle1.direction) {
            case 0: return vehicle1.y < vehicle2.y; // North
            case 1: return vehicle1.x > vehicle2.x; // East
            case 2: return vehicle1.y > vehicle2.y; // South
            case 3: return vehicle1.x < vehicle2.x; // West
            default: return false;
        }
    }

    updateTrafficLights(deltaTime) {
        // Count vehicles waiting at each direction
        this.trafficLights.forEach((light, index) => {
            light.carCount = this.countVehiclesWaiting(index);
        });

        // Apply ML predictions to traffic light behavior
        this.applyMLPredictions();

        // Check for emergency vehicles
        const emergencyDirection = this.checkEmergencyVehicles();
        if (emergencyDirection !== -1 && this.currentGreenIndex !== emergencyDirection) {
            this.addLog(`🚨 Emergency override: switching to ${this.trafficLights[emergencyDirection].direction}`, 'warning');
            this.switchLight(emergencyDirection);
            return;
        }

        // Update current light timer
        this.lightChangeTime += deltaTime;

        // Dynamic green time based on vehicle count and ML predictions
        const currentLight = this.trafficLights[this.currentGreenIndex];
        let greenDuration = this.calculateOptimalGreenDuration(currentLight);

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

    applyMLPredictions() {
        // Adjust traffic light weights based on ML predictions
        if (this.currentPredictedScheduling === 'Priority Scheduling') {
            // Prioritize directions with more vehicles
            this.trafficLights.forEach(light => {
                light.mlWeight = 1.0 + (light.carCount * 0.2);
            });
        } else if (this.currentPredictedScheduling === 'Shortest Job First') {
            // Favor directions with fewer vehicles to clear backlog
            const maxCars = Math.max(...this.trafficLights.map(l => l.carCount));
            this.trafficLights.forEach(light => {
                light.mlWeight = maxCars - light.carCount + 0.5;
            });
        } else {
            // Round Robin - equal weights
            this.trafficLights.forEach(light => {
                light.mlWeight = 1.0;
            });
        }
    }

    calculateOptimalGreenDuration(light) {
        const baseTime = this.minGreenTime;
        const carBonus = light.carCount * 1000;
        const mlBonus = light.mlWeight * 1000;
        const emergencyBonus = this.vehicles.some(v => v.isEmergency && v.direction === this.currentGreenIndex) ? 3000 : 0;
        
        return Math.min(this.maxGreenTime, baseTime + carBonus + mlBonus + emergencyBonus);
    }

    countVehiclesWaiting(direction) {
        let count = 0;
        this.vehicles.forEach(vehicle => {
            if (vehicle.direction === direction && vehicle.stopped) {
                count++;
                vehicle.waitTime += 16.67; // Approximate frame time
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

        // Use ML-enhanced direction selection
        let nextDirection = this.selectOptimalDirection();

        this.currentGreenIndex = nextDirection;
        this.trafficLights[this.currentGreenIndex].state = 'green';
        this.lightChangeTime = 0;

        const light = this.trafficLights[this.currentGreenIndex];
        this.addLog(`💚 Switched to ${light.direction} (${light.carCount} vehicles, ML weight: ${light.mlWeight.toFixed(1)})`);
    }

    selectOptimalDirection() {
        // Calculate scores for each direction based on vehicles, ML weight, and emergency status
        let bestDirection = (this.currentGreenIndex + 1) % 4;
        let bestScore = 0;

        this.trafficLights.forEach((light, index) => {
            if (index === this.currentGreenIndex) return; // Skip current green

            let score = light.carCount * light.mlWeight;
            
            // Emergency vehicle bonus
            if (this.vehicles.some(v => v.isEmergency && v.direction === index)) {
                score += 100;
            }

            // Waiting time bonus
            const avgWaitTime = this.getAverageWaitTime(index);
            score += avgWaitTime / 1000;

            if (score > bestScore) {
                bestScore = score;
                bestDirection = index;
            }
        });

        return bestDirection;
    }

    getAverageWaitTime(direction) {
        const waitingVehicles = this.vehicles.filter(v => v.direction === direction && v.stopped);
        if (waitingVehicles.length === 0) return 0;
        
        return waitingVehicles.reduce((sum, v) => sum + v.waitTime, 0) / waitingVehicles.length;
    }

    updateVehicles(deltaTime) {
        // Use reverse iteration to safely remove vehicles
        for (let i = this.vehicles.length - 1; i >= 0; i--) {
            const vehicle = this.vehicles[i];

            // Skip accident vehicles
            if (vehicle.speed === 0 && vehicle.color === '#8B0000') {
                continue;
            }

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

        // Update waiting count and efficiency
        this.stats.currentWaiting = this.vehicles.filter(v => v.stopped).length;
        this.updateTrafficEfficiency();
        this.updateStats();
    }

    updateTrafficEfficiency() {
        const totalVehicles = this.stats.totalVehicles || 1;
        const passedRatio = this.stats.vehiclesPassed / totalVehicles;
        const violationPenalty = this.stats.ruleViolations * 2;
        const accidentPenalty = this.stats.accidents * 10;
        
        this.stats.trafficEfficiency = Math.max(0, Math.min(100, 
            (passedRatio * 100) - violationPenalty - accidentPenalty
        ));
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

        // Draw accident markers
        this.drawAccidents();

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

            // Vehicle count and ML weight
            this.ctx.fillStyle = '#3498db';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`🚗 ${light.carCount}`, light.x, light.y + 35);
            this.ctx.fillText(`ML: ${light.mlWeight.toFixed(1)}`, light.x, light.y + 47);
        });
    }

    drawTimer(light, index) {
        let timeRemaining;
        if (light.state === 'green') {
            const greenDuration = this.calculateOptimalGreenDuration(light);
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

            // Rule violation indicator
            if (vehicle.hasViolatedRules) {
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.beginPath();
                this.ctx.arc(0, -vehicle.height/2 - 5, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    drawAccidents() {
        this.accidents.forEach(accident => {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💥', accident.location.x, accident.location.y);
            
            // Accident warning
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText('ACCIDENT', accident.location.x, accident.location.y + 15);
        });
    }

    drawUI() {
        // Current green indicator with ML prediction
        const currentLight = this.trafficLights[this.currentGreenIndex];
        this.ctx.fillStyle = 'rgba(46, 204, 113, 0.9)';
        this.ctx.fillRect(10, 10, 300, 60);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`🟢 GREEN: ${currentLight.direction}`, 20, 35);
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`🤖 ML Prediction: ${this.currentPredictedScheduling}`, 20, 55);

        // Safety metrics
        this.ctx.fillStyle = 'rgba(231, 76, 60, 0.9)';
        this.ctx.fillRect(10, 80, 300, 60);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`🚔 Violations: ${this.stats.ruleViolations}`, 20, 100);
        this.ctx.fillText(`💥 Accidents: ${this.stats.accidents}`, 20, 120);
        this.ctx.fillText(`⚡ Efficiency: ${this.stats.trafficEfficiency.toFixed(1)}%`, 150, 100);

        // Instructions
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, this.canvasHeight - 80, 350, 70);
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Controls:', 20, this.canvasHeight - 60);
        this.ctx.fillText('5-8 - Emergency Vehicle (N/E/S/W)', 20, this.canvasHeight - 45);
        this.ctx.fillText('1-4 - Spawn Vehicle (N/E/S/W)', 20, this.canvasHeight - 30);
        this.ctx.fillText('🤖 AI Model: Auto-training & predicting every 5-10s', 20, this.canvasHeight - 15);
    }

    updateStats() {
        document.getElementById('totalVehicles').textContent = this.stats.totalVehicles;
        document.getElementById('avgWaitTime').textContent = `${this.stats.currentWaiting}`;
        document.getElementById('congestedAreas').textContent = this.stats.emergencyVehicles;

        // Update additional stats in intersections area
        const container = document.getElementById('intersections');
        container.innerHTML = `
            <div class="stat-summary">
                <h3>🚦 Live Traffic Status with AI</h3>
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
                    <div class="stat-item">
                        <span class="stat-label">🤖 ML Predictions:</span>
                        <span class="stat-value">${this.stats.mlPredictions}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">🚔 Rule Violations:</span>
                        <span class="stat-value">${this.stats.ruleViolations}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">💥 Accidents:</span>
                        <span class="stat-value">${this.stats.accidents}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">⚡ Efficiency:</span>
                        <span class="stat-value">${this.stats.trafficEfficiency.toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">🔮 Current Prediction:</span>
                        <span class="stat-value">${this.currentPredictedScheduling}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - (this.lastTime || currentTime);
        this.lastTime = currentTime;

        // ML Integration - Log data, train model, get predictions
        await this.logDataToCSV(currentTime);
        await this.trainMLModel(currentTime);
        await this.getPrediction(currentTime);

        // Safety systems
        this.detectRuleViolations();
        this.detectAndPreventAccidents();

        // Auto-spawn vehicles
        if (currentTime - this.lastSpawnTime > this.spawnRate) {
            const direction = Math.floor(Math.random() * 4);
            this.spawnVehicle(direction, 'random');
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

        this.addLog('🚀 Starting smart traffic simulation with AI integration...', 'success');
        this.addLog('🤖 ML model will train every 5 seconds and predict every 10 seconds', 'success');
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
        this.ruleViolations = [];
        this.accidents = [];
        this.stats = {
            totalVehicles: 0,
            vehiclesPassed: 0,
            emergencyVehicles: 0,
            currentWaiting: 0,
            ruleViolations: 0,
            accidents: 0,
            mlPredictions: 0,
            averageWaitTime: 0,
            trafficEfficiency: 100
        };

        // Reset counters
        this.redLightViolations = 0;
        this.speedingViolations = 0;
        this.accidentCount = 0;

        // Reset traffic lights
        this.trafficLights.forEach((light, index) => {
            light.state = index === 0 ? 'green' : 'red';
            light.timer = 0;
            light.carCount = 0;
            light.mlWeight = 1.0;
        });
        this.currentGreenIndex = 0;
        this.lightChangeTime = 0;

        // Reset ML timers
        this.lastDataLogTime = 0;
        this.lastTrainingTime = 0;
        this.lastPredictionTime = 0;
        this.currentPredictedScheduling = 'Round Robin';

        this.updateStats();
        this.draw();

        document.getElementById('logContainer').innerHTML = '';
        this.addLog('🔄 System reset completed - AI model reset', 'success');
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

        // Keep only last 20 log entries
        while (logContainer.children.length > 20) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }

    findSafeSpawnPosition(direction) {
        const vehiclesInDirection = this.vehicles.filter(v => v.direction === direction);
        if (vehiclesInDirection.length === 0) return { safe: true, offset: 0 };

        // Check for safe spawning distance
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

        const safeDistance = 35;
        return {
            safe: vehiclesInDirection.length < 10, // Max 10 vehicles per direction
            offset: maxOffset + safeDistance
        };
    }
}

// Initialize the simulation when page loads
document.addEventListener('DOMContentLoaded', () => {
    const simulation = new TrafficSimulation();
    simulation.draw(); // Initial draw
});
