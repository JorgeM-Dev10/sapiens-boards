-- Verificar que las tablas Order y OrderItem se crearon correctamente

-- 1. Verificar que las tablas existen
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Order', 'OrderItem')
ORDER BY table_name;

-- 2. Verificar las columnas de la tabla Order
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Order'
ORDER BY ordinal_position;

-- 3. Verificar las columnas de la tabla OrderItem
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'OrderItem'
ORDER BY ordinal_position;

-- 4. Verificar las foreign keys creadas
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (tc.table_name = 'Order' OR tc.table_name = 'OrderItem')
ORDER BY tc.table_name, tc.constraint_name;

-- 5. Verificar los índices creados
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename = 'Order' OR tablename = 'OrderItem')
ORDER BY tablename, indexname;

