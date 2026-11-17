-- Ejecutar en pgAdmin conectado a tu base de la tienda (Query Tool, F5)

-- Los clientes de la tienda: con ellos inician sesión
CREATE TABLE IF NOT EXISTS clientes (
    id         SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    email      VARCHAR(120) NOT NULL UNIQUE,
    password   VARCHAR(100) NOT NULL,     -- aquí va el HASH, nunca la clave
    rol        VARCHAR(20)  NOT NULL DEFAULT 'cliente',
    activo     BOOLEAN      NOT NULL DEFAULT true,
    creado_en  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS productos (
    id           SERIAL PRIMARY KEY,
    nombre       VARCHAR(120) NOT NULL,
    precio       NUMERIC(10, 2) NOT NULL CHECK (precio > 0),
    stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    categoria_id INTEGER UNIQUE REFERENCES categorias(id) ON DELETE SET NULL
);