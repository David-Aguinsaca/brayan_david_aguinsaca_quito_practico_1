// src/app.js · arma la aplicación
const express = require('express');
const productosRoutes = require('./routes/productos.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/productos', productosRoutes);
app.use('/categorias', categoriasRoutes);

// Si algo falla en la base, responde 500 sin mostrar el error SQL
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({
    mensaje: err.status === 404 ? err.message : 'Error interno del servidor'
  });
});

module.exports = app;