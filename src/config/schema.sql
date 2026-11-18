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

-- 1. CABECERA: un pedido por compra, de UN cliente
CREATE TABLE IF NOT EXISTS pedidos (
    id          SERIAL PRIMARY KEY,
    cliente_id  INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    fecha       TIMESTAMP     NOT NULL DEFAULT NOW(),
    estado      VARCHAR(20)   NOT NULL DEFAULT 'pendiente',
    total       NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- 2. DETALLE: una fila por cada producto del pedido
CREATE TABLE IF NOT EXISTS detalle_pedido (
    id               SERIAL PRIMARY KEY,
    pedido_id        INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id      INTEGER NOT NULL REFERENCES productos(id),
    cantidad         INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario  NUMERIC(10,2) NOT NULL,   -- el precio de ESE día
    subtotal         NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_pedido_id ON detalle_pedido(pedido_id);
