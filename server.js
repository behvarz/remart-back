require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { generateSystemPrompt } = require('./artist-knowledge-comprehensive');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware - Multiple frontend URLs support
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://remart-front.vercel.app',
  /https:\/\/.*\.vercel\.app$/, // Vercel preview URLs
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });
    
    callback(null, isAllowed);
  },
  credentials: true
}));
app.use(express.json());

// Store conversation histories (in production, use Redis or database)
const conversationHistories = new Map();

// Generate unique session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Remart AI Chatbot API is running' });
});

// Debug endpoint for deployment troubleshooting
app.get('/api/debug', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      FRONTEND_URL: process.env.FRONTEND_URL,
      HAS_OPENAI_KEY: !!process.env.OPENAI_API_KEY,
      ALLOWED_ORIGINS: allowedOrigins.map(origin => 
        origin instanceof RegExp ? origin.toString() : origin
      )
    },
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      'user-agent': req.headers['user-agent']
    },
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, artworkContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation history
    let conversationHistory;
    if (sessionId && conversationHistories.has(sessionId)) {
      conversationHistory = conversationHistories.get(sessionId);
    } else {
      let systemPrompt = generateSystemPrompt();
      
      // Add artwork context if provided
      if (artworkContext) {
        systemPrompt += `\n\nÖNEMLİ: Şu anda "${artworkContext.name}" eseri hakkında konuşuyoruz. Bu eserle ilgili sorular geldiğinde, eserin detaylarını kullanarak cevap ver. Eser bilgileri:
- Eser Adı: ${artworkContext.name}
- Ebat: ${artworkContext.size}
- Teknik: ${artworkContext.technique}
- Açıklama: ${artworkContext.description}
- Hikaye: ${artworkContext.story}
- Özel Özellikler: ${artworkContext.specialFeatures}`;
      }
      
      conversationHistory = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];
    }

    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: message
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: conversationHistory,
      max_tokens: 300,
      temperature: 0.8,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    const botMessage = completion.choices[0].message.content;

    // Add bot response to history
    conversationHistory.push({
      role: 'assistant',
      content: botMessage
    });

    // Keep conversation history limited (last 20 messages + system)
    if (conversationHistory.length > 21) {
      conversationHistory = [
        conversationHistory[0], // Keep system message
        ...conversationHistory.slice(-20)
      ];
    }

    // Store updated history
    const newSessionId = sessionId || generateSessionId();
    conversationHistories.set(newSessionId, conversationHistory);

    // Clean up old sessions (older than 1 hour)
    cleanupOldSessions();

    res.json({
      message: botMessage,
      sessionId: newSessionId
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ 
        error: 'API quota exceeded. Please check your OpenAI account.' 
      });
    }
    
    if (error.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your configuration.' 
      });
    }

    res.status(500).json({ 
      error: 'An error occurred while processing your request.' 
    });
  }
});

// Clear conversation history endpoint
app.post('/api/chat/clear', (req, res) => {
  const { sessionId } = req.body;
  
  if (sessionId && conversationHistories.has(sessionId)) {
    conversationHistories.delete(sessionId);
  }
  
  res.json({ message: 'Conversation cleared' });
});

// Cleanup old sessions
function cleanupOldSessions() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  for (const [sessionId, _] of conversationHistories) {
    const timestamp = parseInt(sessionId.split('_')[1]);
    if (timestamp < oneHourAgo) {
      conversationHistories.delete(sessionId);
    }
  }
}

// Cleanup old sessions every 30 minutes
setInterval(cleanupOldSessions, 30 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Remart AI Chatbot API running on port ${PORT}`);
  console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`✅ OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : '❌ Missing!'}`);
});

module.exports = app;


