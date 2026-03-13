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
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true }
});

// Security
app.use(helmet());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '15mb' }));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

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

// Socket.io: Real-time interview events
io.on('connection', (socket) => {
  socket.on('join_interview', (sessionId) => {
    socket.join(sessionId);
    console.log(`Socket joined interview: ${sessionId}`);
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

server.listen(process.env.PORT || 5000, () =>
  console.log(`CareerBridge API ready on port ${process.env.PORT || 5000}`)
);
