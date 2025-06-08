const mongoose = require('mongoose');

const driverCarSchema = new mongoose.Schema({
  idUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'driverUser',
    required: true
  },
  marca: {
    type: String,
    required: true
  },
  placa: {
    type: String,
    required: true,
    unique: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.driverCar || mongoose.model('driverCar', driverCarSchema);