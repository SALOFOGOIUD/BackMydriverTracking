const express = require('express');
const cors = require('cors');
const { connectDB } = require('./BD/server');

// 🔧 Configura los orígenes permitidos
const allowedOrigins = [
  'https://mydrivertracking.netlify.app',
  'http://localhost:3000' // por si también pruebas en local
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true
};

const app = express();
const port = process.env.PORT || 4000;

// 🛡️ Usa el middleware CORS con opciones
app.use(cors(corsOptions));
app.use(express.json());

// 🔌 Conecta a la base de datos
connectDB();

// 📦 Rutas
const authRoutes = require('./routes/auth.routes');
const driverCarRoutes = require('./routes/drivercar.routes');
const incomeRoutes = require('./routes/income.routes');
const expenseRoutes = require('./routes/expense.routes');
const fixedCostRoutes = require('./routes/fixedcost.routes');
const reminderRoutes = require('./routes/reminder.routes');

app.use('/api/auth', authRoutes);
app.use('/api/drivercars', driverCarRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/fixedcosts', fixedCostRoutes);
app.use('/api/reminders', reminderRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ API escuchando en http://0.0.0.0:${port}`);
});
