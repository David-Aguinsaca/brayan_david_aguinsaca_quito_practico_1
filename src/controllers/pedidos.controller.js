// src/controllers/pedidos.controller.js · controlador para pedidos y cálculo de totales
const Pedido = require('../model/pedido.model');
const Producto = require('../model/producto.model');

const idValido = (id) => Number.isInteger(id) && id > 0;

/**
 * Listar pedidos.
 * - Cliente: solo lista sus propios pedidos.
 * - Admin: puede listar todos o filtrar por cliente.
 */
async function listar(req, res) {
  let clienteId = req.usuario.id;
  if (req.usuario.rol === 'admin') {
    if (req.query.cliente_id) {
      clienteId = Number(req.query.cliente_id);
    } else if (req.query.todos === 'true' || !req.query.cliente_id) {
      clienteId = null;
    }
  }

  const pedidos = await Pedido.listar(clienteId);
  res.status(200).json(pedidos);
}

/**
 * Obtener un pedido por ID.
 * Responde 404 si el pedido no existe o si no pertenece al cliente autenticado.
 */
async function obtener(req, res) {
  const id = Number(req.params.id);
  if (!idValido(id)) return res.status(400).json({ mensaje: 'Id inválido' });

  const pedido = await Pedido.buscarPorId(id);
  if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

  // Responder 404 cuando un cliente pida un pedido que no es suyo
  if (req.usuario.rol !== 'admin' && Number(pedido.cliente_id) !== Number(req.usuario.id)) {
    return res.status(404).json({ mensaje: 'Pedido no encontrado' });
  }

  res.status(200).json(pedido);
}

/**
 * Crear un pedido.
 * El cliente_id se asigna automáticamente desde el token JWT.
 * Recibe una lista obligatoria de items/detalles.
 */
async function crear(req, res) {
  const datos = req.body || {};
  const items = datos.items || datos.detalles;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      mensaje: 'items debe ser un arreglo no vacío'
    });
  }

  for (const item of items) {
    const productoId = Number(item?.producto_id);
    const cantidad = Number(item?.cantidad);

    if (!item || !idValido(productoId)) {
      return res.status(400).json({
        mensaje: 'Cada item debe tener un producto_id mayor a 0'
      });
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return res.status(400).json({
        mensaje: 'Cada item debe tener una cantidad mayor a 0'
      });
    }

    const producto = await Producto.buscarPorId(productoId);
    if (!producto) {
      return res.status(400).json({
        mensaje: `El producto con id ${productoId} no existe`
      });
    }
  }

  const itemsNormalizados = items.map((item) => ({
    producto_id: Number(item.producto_id),
    cantidad: Number(item.cantidad)
  }));

  const nuevoPedido = await Pedido.crear({
    cliente_id: req.usuario.id,
    estado: datos.estado || 'pendiente',
    items: itemsNormalizados
  });

  const pedidoConDetalle = await Pedido.buscarPorId(nuevoPedido.id);
  res.status(201).json(pedidoConDetalle);
}

/**
 * Actualizar datos de un pedido (por ejemplo, estado o total).
 * Responde 404 si el pedido no pertenece al cliente autenticado.
 */
async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!idValido(id)) return res.status(400).json({ mensaje: 'Id inválido' });

  const pedido = await Pedido.buscarPorId(id);
  if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

  // Responder 404 cuando un cliente pida un pedido que no es suyo
  if (req.usuario.rol !== 'admin' && Number(pedido.cliente_id) !== Number(req.usuario.id)) {
    return res.status(404).json({ mensaje: 'Pedido no encontrado' });
  }

  const datos = req.body || {};
  const pedidoActualizado = await Pedido.actualizar(id, datos);
  res.status(200).json(pedidoActualizado);
}

/**
 * Eliminar un pedido.
 * Responde 404 si el pedido no pertenece al cliente autenticado.
 */
async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!idValido(id)) return res.status(400).json({ mensaje: 'Id inválido' });

  const pedido = await Pedido.buscarPorId(id);
  if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

  // Responder 404 cuando un cliente pida un pedido que no es suyo
  if (req.usuario.rol !== 'admin' && Number(pedido.cliente_id) !== Number(req.usuario.id)) {
    return res.status(404).json({ mensaje: 'Pedido no encontrado' });
  }

  const borrado = await Pedido.eliminar(id);
  if (!borrado) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

  res.status(204).send();
}

/**
 * Calcular el total del pedido con la suma de los subtotales por pedido y cliente.
 * Responde 404 cuando un cliente pida un pedido que no es suyo.
 */
async function calcularTotal(req, res) {
  const id = Number(req.params.id);
  if (!idValido(id)) return res.status(400).json({ mensaje: 'Id inválido' });

  const pedido = await Pedido.buscarPorId(id);
  if (!pedido) {
    return res.status(404).json({ mensaje: 'Pedido no encontrado' });
  }

  // Responder 404 cuando un cliente pida un pedido que no es suyo
  if (req.usuario.rol !== 'admin' && Number(pedido.cliente_id) !== Number(req.usuario.id)) {
    return res.status(404).json({ mensaje: 'Pedido no encontrado' });
  }

  const clienteIdFiltro = req.usuario.rol === 'admin' ? null : req.usuario.id;
  const resultado = await Pedido.calcularTotal(id, clienteIdFiltro);

  if (!resultado || resultado.noEsDueno) {
    return res.status(404).json({ mensaje: 'Pedido no encontrado' });
  }

  res.status(200).json(resultado);
}

/**
 * Agregar un item/detalle a un pedido existente.
 * Responde 404 si no pertenece al cliente autenticado.
 */
async function agregarItem(req, res) {
  const id = Number(req.params.id);
  if (!idValido(id)) return res.status(400).json({ mensaje: 'Id inválido' });

  const pedido = await Pedido.buscarPorId(id);
  if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

  if (req.usuario.rol !== 'admin' && Number(pedido.cliente_id) !== Number(req.usuario.id)) {
    return res.status(404).json({ mensaje: 'Pedido no encontrado' });
  }

  const { producto_id, cantidad, precio_unitario } = req.body || {};
  if (!producto_id || !idValido(Number(producto_id))) {
    return res.status(400).json({ mensaje: 'producto_id es obligatorio y debe ser válido' });
  }
  if (!cantidad || !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
    return res.status(400).json({ mensaje: 'cantidad debe ser un entero mayor a 0' });
  }

  const resultado = await Pedido.agregarDetalle(id, {
    producto_id: Number(producto_id),
    cantidad: Number(cantidad),
    precio_unitario: precio_unitario !== undefined ? Number(precio_unitario) : undefined
  });

  res.status(201).json(resultado);
}

/**
 * Eliminar un item/detalle de un pedido.
 * Responde 404 si no pertenece al cliente autenticado.
 */
async function eliminarItem(req, res) {
  const id = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  if (!idValido(id) || !idValido(itemId)) {
    return res.status(400).json({ mensaje: 'Id inválido' });
  }

  const pedido = await Pedido.buscarPorId(id);
  if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

  if (req.usuario.rol !== 'admin' && Number(pedido.cliente_id) !== Number(req.usuario.id)) {
    return res.status(404).json({ mensaje: 'Pedido no encontrado' });
  }

  const resultado = await Pedido.eliminarDetalle(id, itemId);
  if (!resultado) {
    return res.status(404).json({ mensaje: 'Detalle de pedido no encontrado' });
  }

  res.status(200).json(resultado);
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  calcularTotal,
  agregarItem,
  eliminarItem
};
