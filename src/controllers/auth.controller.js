const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Cliente = require('../model/cliente.model');

function crearToken(cliente) {
  return jwt.sign(
    { id: cliente.id, email: cliente.email, rol: cliente.rol },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function registrar(req, res) {
  const { nombre, email, password } = req.body || {};

  const emailValido = typeof email === 'string'
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!nombre || !emailValido || !password || password.length < 8) {
    return res.status(400).json({
      mensaje: 'Nombre, email válido y una contraseña de al menos 8 caracteres son obligatorios'
    });
  }

  const clienteExistente = await Cliente.buscarPorEmail(email);
  if (clienteExistente) {
    return res.status(409).json({ mensaje: 'El email ya está registrado' });
  }

  const passwordEncriptada = await bcrypt.hash(password, 10);
  const cliente = await Cliente.crearCliente(nombre, email, passwordEncriptada);

  res.status(201).json({ cliente, token: crearToken(cliente) });
}

async function iniciarSesion(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
  }

  const cliente = await Cliente.buscarPorEmail(email);
  const passwordValida = cliente && await bcrypt.compare(password, cliente.password);
  if (!passwordValida) {
    return res.status(401).json({ mensaje: 'Credenciales inválidas' });
  }

  const { password: _, ...datosCliente } = cliente;
  res.status(200).json({ cliente: datosCliente, token: crearToken(cliente) });
}

module.exports = { registrar, iniciarSesion };