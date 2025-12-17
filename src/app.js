const express = require('express');
const cors = require('cors');
const tasksRoutes = require('./routes/tasks');
const streaksRoutes = require('./routes/streaks');
const authRoutes = require('./routes/auth');
require('./utils/cron');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/tasks', tasksRoutes);
app.use('/api/streaks', streaksRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;