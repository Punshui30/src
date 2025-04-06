import { PythonShell } from 'python-shell';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import { GoogleAuth } from 'google-auth-library';
import fetch from 'node-fetch';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://192.168.1.104:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Load Vertex AI Key
const keyFile = join(__dirname, 'argos-backend/argos-vertex-ai-key.json');
let key;
try {
  key = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
  console.log('Vertex AI key loaded');
} catch (err) {
  console.error('Failed to load Vertex AI key:', err);
  return;
}

const auth = new GoogleAuth({
  credentials: key,
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// Template Routes
app.get('/api/templates', async (req, res) => {
  // Replace with actual data fetch logic (e.g., from a database)
  res.json({ templates: [] }); // Send real data here
});

app.post('/api/templates', (req, res) => {
  const template = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  // Save the template in your database (replace mock logic here)
  res.status(201).json({ template });
});

// Adapter Routes
app.get('/api/adapters', async (req, res) => {
  // Replace with real data fetch logic
  res.json({ adapters: [] }); // Send real data here
});

// Improved Vertex AI Transcode Route
app.post('/api/transcode', async (req, res) => {
  const { code, sourceLanguage, targetLanguage } = req.body;

  if (!code) {
    console.log('Missing required code parameter');
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    let mockOutput;
    if (code.includes('function')) {
      // JavaScript to Python conversion
      mockOutput = code
        .replace(/function\s+(\w+)\s*\(/g, 'def $1(')
        .replace(/return\s+/g, 'return ')
        .replace(/{/g, ':')
        .replace(/}/g, '')
        .replace(/;/g, '');
    } else if (code.includes('def')) {
      // Python to JavaScript conversion
      mockOutput = code
        .replace(/def\s+(\w+)\s*\(/g, 'function $1(')
        .replace(/return\s+/g, 'return ')
        .replace(/:/g, ' {')
        .split('\n')
        .map(line => line.endsWith('{') ? line : line + ';')
        .join('\n') + '\n}';
    } else {
      // Default fallback
      mockOutput = `// Transcoded code\n${code}`;
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      output: mockOutput,
      metadata: {
        timestamp: new Date().toISOString(),
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage: targetLanguage || 'auto'
      }
    });
  } catch (error) {
    console.error('Error during transcode:', error);
    res.status(500).json({ 
      error: 'An error occurred during transcoding',
      details: error.message 
    });
  }
});

// Python Integration (Ingest)
app.post('/ingest', async (req, res) => {
  try {
    let pyshell = new PythonShell('main.py', {
      mode: 'json',
      pythonPath: 'python3',
      args: ['--port', '8000']
    });

    pyshell.send(req.body);
    pyshell.on('message', function (message) {
      res.json(message);
    });
    pyshell.end(function (err) {
      if (err) {
        console.error('Python error:', err);
        res.status(500).json({ error: err.message });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
