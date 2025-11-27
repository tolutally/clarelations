import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeContactRouter from './api/analyzeContact';
import analyzeDealRouter from './api/analyzeDeal';
import analyzeTranscriptRouter from './api/analyzeTranscript';
import chatWithDealRouter from './api/chatWithDeal';
import analyzeDealSignalRouter from './api/analyzeDealSignal';
import gmailRouter from './api/gmail';

// Load environment variables from .env.local or .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

// Create a backend-compatible Supabase client check
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase client initialized for backend');
} else {
  console.log('⚠️  Running in mock data mode (no Supabase)');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support larger transcript uploads

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', analyzeContactRouter);
app.use('/api', analyzeDealRouter);
app.use('/api', analyzeTranscriptRouter);
app.use('/api', chatWithDealRouter);
app.use('/api/analyze-deal-signal', analyzeDealSignalRouter);
app.use('/api', gmailRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 API endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/analyze-contact`);
  console.log(`   - POST http://localhost:${PORT}/api/analyze-deal`);
  console.log(`   - POST http://localhost:${PORT}/api/analyze-transcript`);
  console.log(`   - POST http://localhost:${PORT}/api/chat-with-deal`);
  console.log(`   - POST http://localhost:${PORT}/api/analyze-deal-signal`);
  console.log(`📧 Gmail API endpoints:`);
  console.log(`   - GET http://localhost:${PORT}/api/gmail/connect`);
  console.log(`   - GET http://localhost:${PORT}/api/gmail/callback`);
  console.log(`   - GET http://localhost:${PORT}/api/gmail/status`);
  console.log(`   - POST http://localhost:${PORT}/api/gmail/sync`);
});
