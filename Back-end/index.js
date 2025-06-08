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

const app = express();
const port = process.env.PORT || 4000;

// CORS configurado para permitir acceso desde Netlify
const corsOptions = {
  origin: ['https://mydrivertracking.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware para recibir JSON
app.use(express.json());

// Conexión a la base de datos
connectDB();

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/drivercars', driverCarRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/fixedcosts', fixedCostRoutes);
app.use('/api/reminders', reminderRoutes);

// Inicio del servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ API escuchando en http://0.0.0.0:${port}`);
});
