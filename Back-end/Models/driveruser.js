const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driveruserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  clave: { type: String, required: true }
});

driveruserSchema.pre('save', async function (next) {
  if (!this.isModified('clave')) return next();
  const salt = await bcrypt.genSalt(10);
  this.clave = await bcrypt.hash(this.clave, salt);
  next();
});

driveruserSchema.methods.validarClave = async function (claveIngresada) {
  return await bcrypt.compare(claveIngresada, this.clave);
};

const driveruser = mongoose.model('driveruser', driveruserSchema);

module.exports = driveruser;
