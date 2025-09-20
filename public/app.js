class TrafficSimulation {
    constructor() {
        this.isRunning = false;
        this.simulationInterval = null;
        this.canvas = document.getElementById('trafficCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.intersections = [];
        this.vehicles = [];
        
        this.initializeEventListeners();
        this.initializeCanvas();
        this.addLog('Traffic simulation system initialized');
    }

    initializeEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startSimulation());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopSimulation());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetSimulation());
    }

    initializeCanvas() {
        // Set up canvas for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.drawInitialCanvas();
    }

    drawInitialCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw road grid
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 8;
        
        // Horizontal roads
        for (let i = 1; i <= 3; i++) {
            const y = (this.canvas.height / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Vertical roads
        for (let i = 1; i <= 3; i++) {
            const x = (this.canvas.width / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw intersections
        this.ctx.fillStyle = '#ff6b6b';
        for (let i = 1; i <= 3; i++) {
            for (let j = 1; j <= 3; j++) {
                const x = (this.canvas.width / 4) * i;
                const y = (this.canvas.height / 4) * j;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 15, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Add title
        this.ctx.fillStyle = '#333';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Traffic Network Visualization', this.canvas.width / 2, 30);
    }

    async fetchTrafficData() {
        try {
            const response = await fetch('/api/traffic-data');
            const data = await response.json();
            return data;
        } catch (error) {
            this.addLog(`Error fetching traffic data: ${error.message}`, 'error');
            return null;
        }
    }

    updateIntersections(trafficData) {
        if (!trafficData) return;
        
        this.intersections = trafficData.intersections;
        const container = document.getElementById('intersections');
        container.innerHTML = '';
        
        trafficData.intersections.forEach(intersection => {
            const card = document.createElement('div');
            card.className = `intersection-card ${intersection.status}`;
            
            card.innerHTML = `
                <div class="intersection-name">${intersection.name}</div>
                <div class="intersection-stats">
                    <span>🚗 Vehicles: ${intersection.vehicles}</span>
                    <span>⏱️ Wait: ${intersection.avgWaitTime}s</span>
                </div>
                <div class="status-indicator status-${intersection.status}">
                    ${intersection.status}
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    updateStats(trafficData) {
        if (!trafficData) return;
        
        const totalVehicles = trafficData.intersections.reduce((sum, int) => sum + int.vehicles, 0);
        const avgWaitTime = Math.round(
            trafficData.intersections.reduce((sum, int) => sum + int.avgWaitTime, 0) / 
            trafficData.intersections.length
        );
        const congestedAreas = trafficData.intersections.filter(int => int.status === 'congested').length;
        
        document.getElementById('totalVehicles').textContent = totalVehicles;
        document.getElementById('avgWaitTime').textContent = `${avgWaitTime}s`;
        document.getElementById('congestedAreas').textContent = congestedAreas;
    }

    drawVehicles() {
        // Simulate vehicle movement on canvas
        this.drawInitialCanvas();
        
        // Draw moving vehicles
        this.ctx.fillStyle = '#4CAF50';
        for (let i = 0; i < this.intersections.length; i++) {
            const intersection = this.intersections[i];
            if (!intersection) continue;
            
            const baseX = (this.canvas.width / 4) * (i + 1);
            const baseY = (this.canvas.height / 4) * (i + 1);
            
            // Draw vehicles around intersection
            for (let v = 0; v < Math.min(intersection.vehicles, 8); v++) {
                const angle = (v / 8) * Math.PI * 2;
                const radius = 30 + (v * 5);
                const x = baseX + Math.cos(angle) * radius;
                const y = baseY + Math.sin(angle) * radius;
                
                this.ctx.fillStyle = intersection.status === 'congested' ? '#ff6b6b' : '#4CAF50';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    addLog(message, type = 'info') {
        const logContainer = document.getElementById('logContainer');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('p');
        
        let prefix = '';
        switch (type) {
            case 'error':
                prefix = '❌ ERROR';
                break;
            case 'warning':
                prefix = '⚠️ WARN';
                break;
            case 'success':
                prefix = '✅ SUCCESS';
                break;
            default:
                prefix = 'ℹ️ INFO';
        }
        
        logEntry.textContent = `[${timestamp}] ${prefix}: ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Keep only last 20 log entries
        while (logContainer.children.length > 20) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }

    async startSimulation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        
        this.addLog('Starting traffic simulation...', 'success');
        
        this.simulationInterval = setInterval(async () => {
            const trafficData = await this.fetchTrafficData();
            if (trafficData) {
                this.updateIntersections(trafficData);
                this.updateStats(trafficData);
                this.drawVehicles();
                
                // Log significant events
                const congestedIntersections = trafficData.intersections.filter(int => int.status === 'congested');
                if (congestedIntersections.length > 0) {
                    this.addLog(`Congestion detected at ${congestedIntersections.length} intersection(s)`, 'warning');
                }
            }
        }, 2000);
    }

    stopSimulation() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        
        this.addLog('Traffic simulation stopped', 'info');
    }

    resetSimulation() {
        this.stopSimulation();
        
        // Reset all displays
        document.getElementById('totalVehicles').textContent = '0';
        document.getElementById('avgWaitTime').textContent = '0s';
        document.getElementById('congestedAreas').textContent = '0';
        
        // Clear intersections
        document.getElementById('intersections').innerHTML = '';
        
        // Reset canvas
        this.drawInitialCanvas();
        
        // Clear logs except initialization
        document.getElementById('logContainer').innerHTML = '<p>System reset. Ready to start simulation.</p>';
        
        this.addLog('System reset completed', 'success');
    }
}

// Initialize the simulation when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TrafficSimulation();
});