// src/app.js · arma la aplicación
const express = require('express');
const productosRoutes = require('./routes/productos.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const authRoutes = require('./routes/auth.routes');
const pedidosRoutes = require('./routes/pedidos.routes');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/productos', productosRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/pedidos', pedidosRoutes);

// Si algo falla en la base o en una validación, responde el status correspondiente
app.use((err, req, res, next) => {
  console.error(err.message);
  const status = err.status || 500;
  res.status(status).json({
    mensaje: status < 500 ? err.message : 'Error interno del servidor'
  });
});

module.exports = app;
