const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('../src/config/db');

const schemaPath = path.join(__dirname, '..', 'src', 'config', 'schema.sql');

async function initializeDatabase() {
  const schema = await fs.readFile(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('Base de datos inicializada correctamente.');
}

initializeDatabase()
  .catch((error) => {
    console.error('No se pudo inicializar la base de datos:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());