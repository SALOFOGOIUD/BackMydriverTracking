const mongoose = require('mongoose');

const fixedCostSchema = new mongoose.Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  idCar: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverCar', required: true },
  concepto: { type: String, required: true },
  valor: { type: Number, required: true },
  klm: { type: Number, required: true },
  fecha: { type: Date, default: Date.now }
});

// ESTA LÍNEA evita el OverwriteModelError:
module.exports = mongoose.models.FixedCost || mongoose.model('FixedCost', fixedCostSchema);
