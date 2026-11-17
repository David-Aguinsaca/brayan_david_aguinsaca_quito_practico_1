// src/routes/productos.routes.js · solo las rutas
const { Router } = require('express');
const ctl = require('../controllers/productos.controller');
const verificarToken = require('../middlewares/verificarToken');

const router = Router();

router.use(verificarToken);
router.get('/', ctl.listar);
router.get('/:id', ctl.obtener);
router.post('/', ctl.crear);
router.put('/:id', ctl.actualizar);
router.delete('/:id', ctl.eliminar);

module.exports = router;