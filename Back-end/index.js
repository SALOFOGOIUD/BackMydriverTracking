const express = require('express');
const cors = require('cors');
const { connectDB } = require('./BD/server');

// Rutas
const authRoutes = require('./routes/auth.routes');
const driverCarRoutes = require('./routes/drivercar.routes');
const incomeRoutes = require('./routes/income.routes');
const expenseRoutes = require('./routes/expense.routes');
const fixedCostRoutes = require('./routes/fixedcost.routes');
const reminderRoutes = require('./routes/reminder.routes');
const geocodingRoutes = require('./routes/geocoding.routes');

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a la base de datos
connectDB();

// Rutas del sistema
app.use('/api/auth', authRoutes);
app.use('/api/drivercars', driverCarRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/fixedcosts', fixedCostRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api', geocodingRoutes);

// Servidor
app.listen(port, () => {
  console.log(`✅ API escuchando en http://localhost:${port}`);
});