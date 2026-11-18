// src/model/pedido.model.js · operaciones SQL para pedidos y detalle_pedido
const pool = require('../config/db');

/**
 * Listar pedidos. Si se proporciona clienteId, lista solo los pedidos de ese cliente.
 * Si clienteId es null/undefined, lista todos los pedidos (ej. para admin).
 */
async function listarMisPedidos(clienteId = null) {
  const query = `
    SELECT 
      p.id,
      p.cliente_id,
      p.fecha,
      p.estado,
      p.total,
      COALESCE(
        json_agg(
          json_build_object(
            'id', dp.id,
            'producto_id', dp.producto_id,
            'producto_nombre', pr.nombre,
            'cantidad', dp.cantidad,
            'precio_unitario', dp.precio_unitario,
            'subtotal', dp.subtotal
          )
        ) FILTER (WHERE dp.id IS NOT NULL), '[]'
      ) AS detalles
    FROM pedidos p
    LEFT JOIN detalle_pedido dp ON p.id = dp.pedido_id
    LEFT JOIN productos pr ON dp.producto_id = pr.id
    ${clienteId ? 'WHERE p.cliente_id = $1' : ''}
    GROUP BY p.id
    ORDER BY p.id DESC
  `;

  const params = clienteId ? [clienteId] : [];
  const r = await pool.query(query, params);
  return r.rows;
}

/**
 * Buscar un pedido por su ID (incluyendo sus detalles y productos).
 */
async function buscarPorId(id) {
  const query = `
    SELECT 
      p.id,
      p.cliente_id,
      p.fecha,
      p.estado,
      p.total,
      COALESCE(
        json_agg(
          json_build_object(
            'id', dp.id,
            'producto_id', dp.producto_id,
            'producto_nombre', pr.nombre,
            'cantidad', dp.cantidad,
            'precio_unitario', dp.precio_unitario,
            'subtotal', dp.subtotal
          )
        ) FILTER (WHERE dp.id IS NOT NULL), '[]'
      ) AS detalles
    FROM pedidos p
    LEFT JOIN detalle_pedido dp ON p.id = dp.pedido_id
    LEFT JOIN productos pr ON dp.producto_id = pr.id
    WHERE p.id = $1
    GROUP BY p.id
  `;

  const r = await pool.query(query, [id]);
  return r.rows[0]; // undefined si no existe
}

/**
 * Crear un pedido. Si se envían items/detalles, se insertan en detalle_pedido
 * dentro de una transacción y se calcula el total automáticamente.
 */
async function crearPedido({ cliente_id, estado = 'pendiente', total = 0, items = [] }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar cabecera del pedido
    const insertPedidoQuery = `
      INSERT INTO pedidos (cliente_id, estado, total)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const resPedido = await client.query(insertPedidoQuery, [
      cliente_id,
      estado,
      total || 0
    ]);
    const pedido = resPedido.rows[0];

    let totalCalculado = 0;
    const detallesCreados = [];

    // 2. Si hay items, insertarlos en detalle_pedido
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        let precioUnitario = item.precio_unitario;

        // Si no se envió precio_unitario, consultarlo de la tabla productos
        if (precioUnitario === undefined || precioUnitario === null) {
          const prodRes = await client.query('SELECT precio FROM productos WHERE id = $1', [item.producto_id]);
          if (!prodRes.rows[0]) {
            const error = new Error(`El producto con id ${item.producto_id} no existe`);
            error.status = 400;
            throw error;
          }
          precioUnitario = prodRes.rows[0].precio;
        }

        const cantidad = Number(item.cantidad);
        const precio = Number(precioUnitario);
        const subtotal = Number((cantidad * precio).toFixed(2));
        totalCalculado += subtotal;

        const insertDetalleQuery = `
          INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const resDetalle = await client.query(insertDetalleQuery, [
          pedido.id,
          item.producto_id,
          cantidad,
          precio,
          subtotal
        ]);
        detallesCreados.push(resDetalle.rows[0]);
      }

      // Actualizar el total del pedido con la suma de los subtotales
      totalCalculado = Number(totalCalculado.toFixed(2));
      await client.query('UPDATE pedidos SET total = $1 WHERE id = $2', [totalCalculado, pedido.id]);
      pedido.total = totalCalculado.toFixed(2);
    }

    await client.query('COMMIT');
    pedido.detalles = detallesCreados;
    return pedido;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Actualizar los datos de un pedido (por ejemplo, estado o total).
 */
async function actualizar(id, { estado, total }) {
  const query = `
    UPDATE pedidos
    SET 
      estado = COALESCE($1, estado),
      total = COALESCE($2, total)
    WHERE id = $3
    RETURNING *
  `;
  const r = await pool.query(query, [estado || null, total !== undefined ? total : null, id]);
  return r.rows[0];
}

/**
 * Eliminar un pedido y sus detalles asociados.
 */
async function eliminar(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM detalle_pedido WHERE pedido_id = $1', [id]);
    const r = await client.query('DELETE FROM pedidos WHERE id = $1', [id]);
    await client.query('COMMIT');
    return r.rowCount > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Calcular el total del pedido mediante la suma de los subtotales de sus detalles.
 * Valida que el pedido exista y pertenezca al cliente especificado (a menos que clienteId sea null).
 * Actualiza la columna `total` en la tabla `pedidos` y retorna el detalle de los cálculos.
 */
async function calcularTotal(pedidoId, clienteId = null) {
  // 1. Verificar si el pedido existe
  const checkPedido = await pool.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
  if (!checkPedido.rows[0]) {
    return null; // Pedido no encontrado
  }

  const pedido = checkPedido.rows[0];

  // 2. Si se especifica clienteId, verificar pertenencia
  if (clienteId !== null && Number(pedido.cliente_id) !== Number(clienteId)) {
    return { noEsDueno: true };
  }

  // 3. Sumar subtotales desde detalle_pedido
  const sumaQuery = `
    SELECT 
      COALESCE(SUM(subtotal), 0) AS total_calculado,
      COUNT(*) AS cantidad_detalles
    FROM detalle_pedido
    WHERE pedido_id = $1
  `;
  const sumaRes = await pool.query(sumaQuery, [pedidoId]);
  const totalCalculado = Number(Number(sumaRes.rows[0].total_calculado).toFixed(2));

  // 4. Actualizar el total del pedido en la tabla pedidos
  const updateQuery = `
    UPDATE pedidos
    SET total = $1
    WHERE id = $2
    RETURNING *
  `;
  const updateRes = await pool.query(updateQuery, [totalCalculado, pedidoId]);
  const pedidoActualizado = updateRes.rows[0];

  // 5. Obtener lista detallada de los subtotales por producto
  const detallesQuery = `
    SELECT 
      dp.id,
      dp.producto_id,
      pr.nombre AS producto_nombre,
      dp.cantidad,
      dp.precio_unitario,
      dp.subtotal
    FROM detalle_pedido dp
    LEFT JOIN productos pr ON dp.producto_id = pr.id
    WHERE dp.pedido_id = $1
    ORDER BY dp.id ASC
  `;
  const detallesRes = await pool.query(detallesQuery, [pedidoId]);

  return {
    mensaje: 'Total del pedido calculado con éxito a partir de los subtotales',
    pedido_id: Number(pedidoActualizado.id),
    cliente_id: Number(pedidoActualizado.cliente_id),
    fecha: pedidoActualizado.fecha,
    estado: pedidoActualizado.estado,
    total: totalCalculado,
    cantidad_items: Number(sumaRes.rows[0].cantidad_detalles),
    subtotales: detallesRes.rows
  };
}

/**
 * Agregar un item a un pedido existente y recalcular el total.
 */
async function agregarDetalle(pedidoId, { producto_id, cantidad, precio_unitario }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let precio = precio_unitario;
    if (precio === undefined || precio === null) {
      const prodRes = await client.query('SELECT precio FROM productos WHERE id = $1', [producto_id]);
      if (!prodRes.rows[0]) {
        const error = new Error(`El producto con id ${producto_id} no existe`);
        error.status = 400;
        throw error;
      }
      precio = prodRes.rows[0].precio;
    }

    const cant = Number(cantidad);
    const prec = Number(precio);
    const subtotal = Number((cant * prec).toFixed(2));

    const insertDetalle = `
      INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const resDetalle = await client.query(insertDetalle, [pedidoId, producto_id, cant, prec, subtotal]);

    // Recalcular total
    const sumaRes = await client.query(
      'SELECT COALESCE(SUM(subtotal), 0) AS total FROM detalle_pedido WHERE pedido_id = $1',
      [pedidoId]
    );
    const nuevoTotal = Number(Number(sumaRes.rows[0].total).toFixed(2));

    await client.query('UPDATE pedidos SET total = $1 WHERE id = $2', [nuevoTotal, pedidoId]);

    await client.query('COMMIT');
    return {
      detalle: resDetalle.rows[0],
      nuevo_total: nuevoTotal
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Eliminar un item de un pedido y recalcular el total.
 */
async function eliminarDetalle(pedidoId, detalleId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const delRes = await client.query(
      'DELETE FROM detalle_pedido WHERE id = $1 AND pedido_id = $2',
      [detalleId, pedidoId]
    );

    if (delRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    // Recalcular total
    const sumaRes = await client.query(
      'SELECT COALESCE(SUM(subtotal), 0) AS total FROM detalle_pedido WHERE pedido_id = $1',
      [pedidoId]
    );
    const nuevoTotal = Number(Number(sumaRes.rows[0].total).toFixed(2));

    await client.query('UPDATE pedidos SET total = $1 WHERE id = $2', [nuevoTotal, pedidoId]);

    await client.query('COMMIT');
    return {
      eliminado: true,
      nuevo_total: nuevoTotal
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  listar: listarMisPedidos,
  buscarPorId,
  crear: crearPedido,
  actualizar,
  eliminar,
  calcularTotal,
  agregarDetalle,
  eliminarDetalle
};
