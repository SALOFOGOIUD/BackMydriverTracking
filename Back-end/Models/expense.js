const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'driverUser', required: true },
  idCar: { type: mongoose.Schema.Types.ObjectId, ref: 'driverCar', required: true },
  dateStart: { type: Date, required: true },
  dateEnd: { type: Date, required: true },
  concepto: { type: String, required: true },
  gastoTotal: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
