const express = require('express');
const router = express.Router();

const driveruser = require('../Models/driveruser'); // nombre actualizado del modelo
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const SECRET_KEY = process.env.SECRET_KEY || "tu_clave_secreta_jwt";
const client = new OAuth2Client("757470978448-8sp8rbnl0ffpt5rfnh3k59dokm675s91.apps.googleusercontent.com");

// Helpers
function camposRequeridos(obj, campos) {
  return campos.every(campo => obj[campo]);
}

function formatearUsuario(usuario) {
  return {
    id: usuario._id,
    email: usuario.email,
    nombre: usuario.nombre
  };
}

async function crearUsuario({ email, nombre, clave }) {
  const existe = await driveruser.findOne({ email });
  if (existe) throw new Error("Email ya registrado");
  const nuevoUsuario = new driveruser({ email, nombre, clave });
  await nuevoUsuario.save();
  return nuevoUsuario;
}

// POST /registro - Registro estándar
router.post('/registro', async (req, res) => {
  const { email, nombre, clave } = req.body;

  if (!camposRequeridos(req.body, ['email', 'nombre', 'clave'])) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const usuario = await crearUsuario({ email, nombre, clave });
    res.status(201).json({
      message: "Usuario registrado correctamente",
      usuario: formatearUsuario(usuario)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, clave } = req.body;

  if (!camposRequeridos(req.body, ['email', 'clave'])) {
    return res.status(400).json({ message: "Email y clave son obligatorios" });
  }

  try {
    const usuario = await driveruser.findOne({ email });
    if (!usuario) return res.status(401).json({ message: "Usuario no encontrado" });

    const claveValida = await usuario.validarClave(clave);
    if (!claveValida) return res.status(401).json({ message: "Clave incorrecta" });

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, nombre: usuario.nombre },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login exitoso", token, usuario: formatearUsuario(usuario) });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error en el servidor" });
  }
});

// POST /google - Login con Google
router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: "757470978448-8sp8rbnl0ffpt5rfnh3k59dokm675s91.apps.googleusercontent.com",
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    let usuario = await driveruser.findOne({ email });
    if (!usuario) {
      usuario = new driveruser({
        email,
        nombre: name,
        clave: googleId // solo como placeholder, idealmente generar token único
      });
      await usuario.save();
    }

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, nombre: usuario.nombre },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login con Google exitoso",
      token,
      usuario: formatearUsuario(usuario)
    });
  } catch (error) {
    res.status(401).json({ message: "Token de Google inválido" });
  }
});

module.exports = router;
