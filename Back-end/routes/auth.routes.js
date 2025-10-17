require('dotenv').config();
const express = require('express');
const router = express.Router();

const driveruser = require('../models/driveruser');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const SECRET_KEY = process.env.SECRET_KEY || 'tu_clave_secreta_jwt';
const oauthClient = new OAuth2Client();

const ENV_AUDIENCES = (process.env.GOOGLE_AUDIENCES || '')
  .split(',').map(s => s.trim()).filter(Boolean);

// Ajusta a los tuyos si no usas .env:
const DEFAULT_AUDIENCES = [
  // ANDROID
  '510782591803-k07kq80ckt0p0107jfedpas8suu5mv3j.apps.googleusercontent.com',
  // WEB
  '757470978448-8sp8rbnl0ffpt5rfnh3k59dokm675s91.apps.googleusercontent.com'
];

const GOOGLE_AUDIENCES = ENV_AUDIENCES.length ? ENV_AUDIENCES : DEFAULT_AUDIENCES;

function camposRequeridos(obj, campos) { return campos.every(campo => obj[campo]); }
function formatearUsuario(usuario) { return { id: usuario._id, email: usuario.email, nombre: usuario.nombre }; }
function firmarToken(usuario) { return jwt.sign({ id: usuario._id, email: usuario.email, nombre: usuario.nombre }, SECRET_KEY, { expiresIn: '7d' }); }

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, clave } = req.body || {};
  if (!camposRequeridos(req.body || {}, ['email', 'clave'])) {
    return res.status(400).json({ message: 'Email y clave son obligatorios' });
  }
  try {
    const usuario = await driveruser.findOne({ email });
    if (!usuario) return res.status(401).json({ message: 'Usuario no encontrado' });

    const ok = await usuario.validarClave(clave);
    if (!ok) return res.status(401).json({ message: 'Clave incorrecta' });

    const token = firmarToken(usuario);
    return res.json({
      message: 'Login exitoso',
      token,
      usuario: formatearUsuario(usuario),
      userId: usuario._id.toString(),
      name: usuario.nombre || null
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || 'Error en el servidor' });
  }
});

// POST /auth/google (acepta Android + Web)
router.post('/google', async (req, res) => {
  const { idToken, email: emailBody, name: nameBody } = req.body || {};
  if (!idToken || typeof idToken !== 'string' || idToken.split('.').length !== 3) {
    return res.status(400).json({ message: 'Falta o inválido idToken' });
  }
  if (!GOOGLE_AUDIENCES.length) {
    return res.status(500).json({ message: 'Configuración inválida: falta GOOGLE_AUDIENCES' });
  }

  try {
    const ticket = await oauthClient.verifyIdToken({ idToken, audience: GOOGLE_AUDIENCES });
    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ message: 'idToken sin payload' });

    const { sub: googleId, iss, aud, email: emailClaim, name: nameClaim } = payload;
    if (iss !== 'https://accounts.google.com' && iss !== 'accounts.google.com') {
      return res.status(401).json({ message: 'Emisor inválido' });
    }
    if (!GOOGLE_AUDIENCES.includes(aud)) {
      return res.status(401).json({ message: 'Audience no permitida' });
    }

    // Preferimos email real si viene del token o del body
    let email = emailClaim || emailBody || null;
    let nombre = nameClaim || nameBody || '';

    // ⚠️ Si NO hay email, fabricamos uno sintético único basado en sub
    // Así no rompemos "required" ni "unique" del esquema, y podemos upsertear.
    let emailSintetico = false;
    if (!email) {
      email = `google_${googleId}@vehicontrol.local`;
      emailSintetico = true;
    }
    if (!nombre) nombre = (email && !emailSintetico) ? email.split('@')[0] : 'Usuario Google';

    // Upsert por email (real o sintético); además vinculamos por googleId
    let usuario = await driveruser.findOne({ $or: [{ email }, { googleId }] });
    if (!usuario) {
      usuario = new driveruser({
        email,
        nombre,
        googleId,
        proveedor: 'google',
        clave: null
      });
      await usuario.save();
    } else {
      // normalizamos: si tiene otro email pero mismo googleId, aseguramos consistencia
      if (!usuario.googleId) usuario.googleId = googleId;
      if (!usuario.nombre && nombre) usuario.nombre = nombre;
      if (!usuario.proveedor) usuario.proveedor = 'google';
      // Si el email guardado era sintético pero ahora llega uno real en futuras sesiones, puedes actualizarlo:
      // if (email && !email.endsWith('@vehicontrol.local') && usuario.email.endsWith('@vehicontrol.local')) {
      //   usuario.email = email;
      // }
      await usuario.save();
    }

    const token = firmarToken(usuario);
    return res.json({
      message: 'Login con Google exitoso',
      token,
      usuario: formatearUsuario(usuario),
      userId: usuario._id.toString(),
      name: usuario.nombre || null
    });
  } catch (error) {
    console.error('[Google Sign-In] Error:', error?.message);
    return res.status(401).json({
      message: 'Token de Google inválido',
      detail: error?.message || 'Error verificando idToken'
    });
  }
});


module.exports = router;
