require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:5173'];

// CORS: allow exact matches + Vercel preview deployments
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow exact matches from FRONTEND_URL
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow Vercel preview deployments (*.vercel.app)
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

const io = new Server(server, { cors: corsOptions });

// Security
app.use(helmet());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '15mb' }));

// Health check with env diagnostics
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  env: {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    JWT_SECRET: !!process.env.JWT_SECRET,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL || '(not set)',
    NODE_ENV: process.env.NODE_ENV || '(not set)',
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/linkedin', require('./routes/linkedin'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tutor', require('./routes/tutor'));
app.use('/api/roadmap', require('./routes/roadmap'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/tts', require('./routes/tts'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/ranking', require('./routes/ranking'));
app.use('/api/resume-improver', require('./routes/resumeImprover'));
app.use('/api/github', require('./routes/github'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));

// Socket.io: Real-time interview events + messaging
io.on('connection', (socket) => {
  socket.on('join_interview', (sessionId) => {
    socket.join(sessionId);
    console.log(`Socket joined interview: ${sessionId}`);
  });

  // Messaging: user joins their own room to receive messages
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('eye_drift', (data) => {
    io.to(data.sessionId).emit('integrity_event', {
      type: 'eye_drift', timestamp: Date.now(), duration: data.duration
    });
  });

  socket.on('tab_switch', (data) => {
    io.to(data.sessionId).emit('integrity_event', {
      type: 'tab_switch', timestamp: Date.now()
    });
  });

  socket.on('answer_submitted', (data) => io.to(data.sessionId).emit('processing', true));
  socket.on('evaluation_done', (data) => io.to(data.sessionId).emit('next_question', data));
});

app.set('io', io);

// Global error handler — return JSON instead of Express 5 default HTML
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`CareerBridge API ready on port ${process.env.PORT || 5000}`)
);
