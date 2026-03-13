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
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

// Security
app.use(helmet());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '15mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/linkedin', require('./routes/linkedin'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/dashboard', require('./routes/dashboard'));

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
