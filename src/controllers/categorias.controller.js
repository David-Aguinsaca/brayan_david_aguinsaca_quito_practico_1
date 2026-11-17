const Categoria = require('../model/categoria.model');

const nombreValido = datos => typeof datos.nombre === 'string'
  && datos.nombre.trim().length > 0;
const idValido = id => Number.isInteger(id) && id > 0;

async function listar(req, res) {
  res.status(200).json(await Categoria.listar());
}

async function obtener(req, res) {
  const id = Number(req.params.id);
  if (!idValido(id)) return res.status(400).json({ mensaje: 'Id inválido' });

  const categoria = await Categoria.buscarPorId(id);
  if (!categoria) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
  res.status(200).json(categoria);
}

async function crear(req, res) {
  const datos = req.body || {};
  if (!nombreValido(datos)) return res.status(400).json({ mensaje: 'Nombre inválido' });

  res.status(201).json(await Categoria.crear({ nombre: datos.nombre.trim() }));
}

async function actualizar(req, res) {
  const id = Number(req.params.id);
  const datos = req.body || {};
  if (!idValido(id)) return res.status(400).json({ mensaje: 'Id inválido' });
  if (!nombreValido(datos)) return res.status(400).json({ mensaje: 'Nombre inválido' });

  const categoria = await Categoria.actualizar(id, { nombre: datos.nombre.trim() });
  if (!categoria) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
  res.status(200).json(categoria);
}

async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!idValido(id)) return res.status(400).json({ mensaje: 'Id inválido' });

  const borrado = await Categoria.eliminar(id);
  if (!borrado) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };