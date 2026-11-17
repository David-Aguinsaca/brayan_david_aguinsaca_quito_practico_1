const { Router } = require('express');
const control = require('../controllers/categorias.controller');
const verificarToken = require('../middlewares/verificarToken');

const router = Router();

const routesCategoria = Router();

//Rutas de productos
routesCategoria.get('/', control.listar);
routesCategoria.get('/:id', control.obtener);
routesCategoria.post('/', verificarToken, control.crear);
routesCategoria.put('/:id', verificarToken, control.actualizar);
routesCategoria.delete('/:id', verificarToken, control.eliminar);

module.exports = routesCategoria;