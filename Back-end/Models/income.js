const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'driverUser', required: true },
  idCar: { type: mongoose.Schema.Types.ObjectId, ref: 'driverCar', required: true },
  dateStart: { type: Date, required: true },
  dateEnd: { type: Date, required: true },
  ingresoTotal: { type: Number, required: true },
  klm: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Income || mongoose.model('income', incomeSchema);

// const Income = mongoose.model('income', incomeSchema);

// module.exports = Income;