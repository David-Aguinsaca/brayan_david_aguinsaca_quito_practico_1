const pool = require('../config/db');

async function listar() {
  const resultado = await pool.query('SELECT * FROM categorias ORDER BY id');
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query(
    'SELECT * FROM categorias WHERE id = $1',
    [id]
  );
  return resultado.rows[0];
}

async function crear({ nombre }) {
  const resultado = await pool.query(
    `INSERT INTO categorias (nombre)
     VALUES ($1) RETURNING *`,
    [nombre]
  );
  return resultado.rows[0];
}

async function actualizar(id, { nombre }) {
  const resultado = await pool.query(
    `UPDATE categorias SET nombre = $1
     WHERE id = $2 RETURNING *`,
    [nombre, id]
  );
  return resultado.rows[0];
}

async function eliminar(id) {
  const resultado = await pool.query(
    'DELETE FROM categorias WHERE id = $1',
    [id]
  );
  return resultado.rowCount > 0;
}

module.exports = { listar, buscarPorId, crear, actualizar, eliminar };