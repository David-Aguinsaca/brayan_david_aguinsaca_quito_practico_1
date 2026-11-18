-- =============================================================================
-- SEEDER SQL: 5 elementos por cada modelo / tabla
-- Base de datos: PostgreSQL
-- Contraseña para todos los clientes de prueba: Password123!
-- Hash bcrypt generado: $2b$10$NFrL70F8nebRYqQhWOnf4O9oUkOMhX21KFwqZJnKvDm./Fb0VC5ee
-- =============================================================================

-- 1. Limpieza de tablas previas (reinicia los IDs a 1)
TRUNCATE TABLE detalle_pedido, pedidos, productos, categorias, clientes RESTART IDENTITY CASCADE;

-- 2. MODELO: Clientes (5 registros)
INSERT INTO clientes (nombre, email, password, rol, activo, creado_en)
VALUES
    ('Carlos Mendoza', 'carlos.mendoza@example.com', '$2b$10$NFrL70F8nebRYqQhWOnf4O9oUkOMhX21KFwqZJnKvDm./Fb0VC5ee', 'admin', true, NOW() - INTERVAL '30 days'),
    ('Ana Gómez', 'ana.gomez@example.com', '$2b$10$NFrL70F8nebRYqQhWOnf4O9oUkOMhX21KFwqZJnKvDm./Fb0VC5ee', 'cliente', true, NOW() - INTERVAL '20 days'),
    ('Juan Pérez', 'juan.perez@example.com', '$2b$10$NFrL70F8nebRYqQhWOnf4O9oUkOMhX21KFwqZJnKvDm./Fb0VC5ee', 'cliente', true, NOW() - INTERVAL '15 days'),
    ('María Rodríguez', 'maria.rodriguez@example.com', '$2b$10$NFrL70F8nebRYqQhWOnf4O9oUkOMhX21KFwqZJnKvDm./Fb0VC5ee', 'cliente', true, NOW() - INTERVAL '10 days'),
    ('Luis Morales', 'luis.morales@example.com', '$2b$10$NFrL70F8nebRYqQhWOnf4O9oUkOMhX21KFwqZJnKvDm./Fb0VC5ee', 'cliente', true, NOW() - INTERVAL '5 days');

-- 3. MODELO: Categorias (5 registros)
INSERT INTO categorias (nombre)
VALUES
    ('Computación'),
    ('Smartphones y Telefonía'),
    ('Audio y Sonido'),
    ('Accesorios y Periféricos'),
    ('Videojuegos y Consolas');

-- 4. MODELO: Productos (5 registros)
INSERT INTO productos (nombre, precio, stock)
VALUES
    ('Laptop Lenovo ThinkPad T14', 950.00, 15),
    ('Smartphone Samsung Galaxy S23', 799.99, 20),
    ('Auriculares Sony WH-1000XM5', 299.90, 12),
    ('Teclado Mecánico RGB Redragon', 65.50, 30),
    ('Consola PlayStation 5 Standard', 549.99, 8);

-- 5. MODELO: Pedidos (5 registros de cabecera)
INSERT INTO pedidos (cliente_id, fecha, estado, total)
VALUES
    (1, NOW() - INTERVAL '12 days', 'completado', 950.00),
    (2, NOW() - INTERVAL '8 days',  'pendiente',  1599.98),
    (3, NOW() - INTERVAL '5 days',  'en_proceso', 299.90),
    (4, NOW() - INTERVAL '2 days',  'pendiente',  131.00),
    (5, NOW() - INTERVAL '1 days',  'completado', 549.99);

-- 6. MODELO: Detalle Pedido (5 registros correspondientes a los pedidos)
INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
VALUES
    (1, 1, 1, 950.00, 950.00),   -- Pedido 1: 1 Laptop ($950.00)
    (2, 2, 2, 799.99, 1599.98),  -- Pedido 2: 2 Smartphones ($799.99 c/u)
    (3, 3, 1, 299.90, 299.90),   -- Pedido 3: 1 Auricular ($299.90)
    (4, 4, 2, 65.50,  131.00),   -- Pedido 4: 2 Teclados ($65.50 c/u)
    (5, 5, 1, 549.99, 549.99);   -- Pedido 5: 1 Consola PS5 ($549.99)
