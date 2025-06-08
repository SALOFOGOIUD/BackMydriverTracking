const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'driverUser', required: true },
  idCar: { type: mongoose.Schema.Types.ObjectId, ref: 'driverCar', required: true },
  dateStart: { type: Date, required: true },
  dateEnd: { type: Date, required: true },
  item: { type: String, required: true },
  detalle: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.models.reminder || mongoose.model('reminder', reminderSchema);
