const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driveruserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  nombre: { type: String, default: '' },
  clave:  { type: String, default: null },  // no requerida para Google
  googleId: { type: String, index: true },
  proveedor: { type: String, enum: ['local', 'google'], default: 'local' },
  rol: { type: String, default: 'Conductor' }
}, { timestamps: true });

driveruserSchema.pre('save', async function (next) {
  if (!this.isModified('clave') || !this.clave) return next();
  const salt = await bcrypt.genSalt(10);
  this.clave = await bcrypt.hash(this.clave, salt);
  next();
});

driveruserSchema.methods.validarClave = async function (claveIngresada) {
  if (!this.clave) return false;
  return await bcrypt.compare(claveIngresada, this.clave);
};

module.exports = mongoose.model('driveruser', driveruserSchema);
