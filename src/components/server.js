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

// Add request logging middleware - ADD THIS NEAR THE TOP
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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
  console.log('Health check called');
  res.json({ status: 'ok', message: 'Server is running' });
});

// Rest of your server.js content remains the same...

// Improved Vertex AI Transcode Route - Make sure this endpoint matches exactly
app.post('/api/transcode', async (req, res) => {
  console.log('Transcode request received:', req.body);
  
  const { code } = req.body;
  
  if (!code) {
    console.log('Missing required code parameter');
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    console.log(`Transcoding code (first 100 chars): ${code.slice(0, 100)}...`);
    
    // Mock transcode function - replace with actual implementation
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Transcode successful');
    res.json({
      output: mockOutput,
      metadata: {
        timestamp: new Date().toISOString(),
        sourceLanguage: 'auto',
        targetLanguage: 'auto'
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

// Rest of your server.js content...

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Transcode endpoint available at http://localhost:${PORT}/api/transcode`);
  console.log(`CORS enabled for multiple origins including localhost:5173 and localhost:5174`);
});