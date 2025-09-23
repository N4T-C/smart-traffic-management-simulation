
const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = 5000;

// Middleware to parse JSON
app.use(express.json());

// Middleware to disable caching for development
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Serve static files from frontend/web_sim
app.use(express.static(path.join(__dirname, 'frontend', 'web_sim')));

// API endpoint for traffic data simulation
app.get('/api/traffic-data', (req, res) => {
  // Simulate traffic data
  const trafficData = {
    intersections: [
      {
        id: 1,
        name: 'Main St & 1st Ave',
        vehicles: Math.floor(Math.random() * 20) + 5,
        avgWaitTime: Math.floor(Math.random() * 30) + 10,
        status: Math.random() > 0.7 ? 'congested' : 'normal'
      },
      {
        id: 2,
        name: 'Oak Rd & 2nd Ave',
        vehicles: Math.floor(Math.random() * 15) + 3,
        avgWaitTime: Math.floor(Math.random() * 25) + 8,
        status: Math.random() > 0.8 ? 'congested' : 'normal'
      },
      {
        id: 3,
        name: 'Pine St & 3rd Ave',
        vehicles: Math.floor(Math.random() * 18) + 7,
        avgWaitTime: Math.floor(Math.random() * 35) + 12,
        status: Math.random() > 0.6 ? 'congested' : 'normal'
      }
    ],
    timestamp: new Date().toISOString()
  };
  
  res.json(trafficData);
});

// ML Integration Endpoints

// Log data to CSV
app.post('/api/log-data', (req, res) => {
  try {
    const { timestamp, cars_present, emergency_vehicle, scheduling_model } = req.body;
    
    const csvLine = `${timestamp},${cars_present},${emergency_vehicle},${scheduling_model}\n`;
    const csvPath = path.join(__dirname, 'model_training', 'data.csv');
    
    fs.appendFileSync(csvPath, csvLine);
    
    console.log(`[ML] Data logged: ${cars_present} cars, Emergency: ${emergency_vehicle ? 'Yes' : 'No'}, Model: ${scheduling_model}`);
    
    res.json({ 
      success: true, 
      message: 'Data logged successfully',
      data: { timestamp, cars_present, emergency_vehicle, scheduling_model }
    });
  } catch (error) {
    console.error('[ML] Error logging data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to log data', 
      error: error.message 
    });
  }
});

// Train ML model
app.post('/api/train-model', (req, res) => {
  const pythonScript = path.join(__dirname, 'model_training', 'tain_model.py');
  
  exec(`python "${pythonScript}"`, { cwd: path.join(__dirname, 'model_training') }, (error, stdout, stderr) => {
    if (error) {
      console.error('[ML] Training error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Model training failed', 
        error: error.message 
      });
    }
    
    console.log('[ML] Training output:', stdout);
    if (stderr) console.log('[ML] Training stderr:', stderr);
    
    res.json({ 
      success: true, 
      message: 'Model trained successfully',
      output: stdout
    });
  });
});

// Get prediction
app.post('/api/predict', (req, res) => {
  const { timestamp, cars_present, emergency_vehicle } = req.body;
  
  // Create a temporary Python script to get prediction
  const predictionScript = `
import sys
import os
sys.path.append('${path.join(__dirname, 'model_training').replace(/\\/g, '\\\\')}')

try:
    from predict_scheduling import predict_scheduling
    result = predict_scheduling('${timestamp}', ${cars_present}, ${emergency_vehicle})
    print(result)
except Exception as e:
    print(f"Error: {e}")
    print("Round Robin")  # Default fallback
`;
  
  const tempScriptPath = path.join(__dirname, 'temp_predict.py');
  fs.writeFileSync(tempScriptPath, predictionScript);
  
  exec(`python "${tempScriptPath}"`, { cwd: __dirname }, (error, stdout, stderr) => {
    // Clean up temp file
    try {
      fs.unlinkSync(tempScriptPath);
    } catch (cleanupError) {
      console.warn('[ML] Failed to cleanup temp file:', cleanupError);
    }
    
    if (error) {
      console.error('[ML] Prediction error:', error);
      return res.json({ 
        scheduling_model: 'Round Robin', // Default fallback
        success: false,
        message: 'Prediction failed, using fallback'
      });
    }
    
    const prediction = stdout.trim() || 'Round Robin';
    console.log(`[ML] Prediction: ${prediction} for ${cars_present} cars, Emergency: ${emergency_vehicle ? 'Yes' : 'No'}`);
    
    res.json({ 
      scheduling_model: prediction,
      success: true,
      input: { timestamp, cars_present, emergency_vehicle }
    });
  });
});

// Rule violations endpoint
app.post('/api/log-violation', (req, res) => {
  try {
    const violation = req.body;
    console.log(`[SAFETY] VIOLATION: ${violation.type} - Vehicle ${violation.vehicleId} in ${violation.direction}`);
    
    // Log to file for analysis
    const logPath = path.join(__dirname, 'violations.log');
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(violation)}\n`;
    fs.appendFileSync(logPath, logEntry);
    
    res.json({ success: true, message: 'Violation logged' });
  } catch (error) {
    console.error('[SAFETY] Error logging violation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Accident endpoint
app.post('/api/log-accident', (req, res) => {
  try {
    const accident = req.body;
    console.log(`[SAFETY] ACCIDENT: ${accident.vehicles.join(' & ')} at (${accident.location.x}, ${accident.location.y})`);
    
    // Log to file for analysis
    const logPath = path.join(__dirname, 'accidents.log');
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(accident)}\n`;
    fs.appendFileSync(logPath, logEntry);
    
    res.json({ success: true, message: 'Accident logged' });
  } catch (error) {
    console.error('[SAFETY] Error logging accident:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Catch all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'web_sim', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Smart Traffic Management Simulation server running on http://0.0.0.0:${PORT}`);
  console.log('🤖 ML Integration: Automatic training every 5 seconds');
  console.log('🔮 AI Predictions: Traffic light optimization every 10 seconds');
  console.log('🚔 Safety Systems: Rule violation and accident detection active');
});
