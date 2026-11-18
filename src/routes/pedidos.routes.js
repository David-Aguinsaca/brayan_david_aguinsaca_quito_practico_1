// src/routes/pedidos.routes.js · rutas protegidas para la entidad Pedido
const { Router } = require('express');
const ctl = require('../controllers/pedidos.controller');
const verificarToken = require('../middlewares/verificarToken');

const router = Router();

// Todas las rutas de pedidos están protegidas por JWT
router.use(verificarToken);

// CRUD de Pedidos
router.get('/', ctl.listar);
router.get('/:id', ctl.obtener);
router.post('/', ctl.crear);
router.put('/:id', ctl.actualizar);
router.delete('/:id', ctl.eliminar);

// API para calcular el total del pedido con la suma de los subtotales por pedido y cliente
// (Se proveen alias GET, POST y PUT para flexibilidad según el cliente HTTP que lo consuma)
router.get('/:id/total', ctl.calcularTotal);
router.post('/:id/total', ctl.calcularTotal);
router.get('/:id/calcular-total', ctl.calcularTotal);
router.post('/:id/calcular-total', ctl.calcularTotal);
router.put('/:id/calcular-total', ctl.calcularTotal);

// Rutas auxiliares para agregar o eliminar items del pedido
router.post('/:id/items', ctl.agregarItem);
router.delete('/:id/items/:itemId', ctl.eliminarItem);

module.exports = router;
