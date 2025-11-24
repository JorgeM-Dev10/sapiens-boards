-- ============================================
-- Script para verificar el usuario admin y la configuración de la base de datos
-- Ejecuta este SQL en Supabase SQL Editor
-- ============================================

-- 1. Verificar que la tabla User existe y tiene la estructura correcta
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- 2. Verificar si existe el usuario admin
SELECT 
    id,
    name,
    email,
    CASE 
        WHEN password IS NULL THEN '❌ SIN CONTRASEÑA'
        WHEN password = '' THEN '❌ CONTRASEÑA VACÍA'
        WHEN LENGTH(password) < 20 THEN '❌ CONTRASEÑA MUY CORTA (no parece hash)'
        ELSE '✅ TIENE CONTRASEÑA'
    END as password_status,
    LENGTH(password) as password_length,
    SUBSTRING(password, 1, 20) || '...' as password_preview,
    "createdAt",
    "updatedAt"
FROM "User"
WHERE email = 'admin@sapiens.com';

-- 3. Listar todos los usuarios (para verificar que hay datos)
SELECT 
    id,
    name,
    email,
    CASE 
        WHEN password IS NULL THEN 'SIN CONTRASEÑA'
        ELSE 'TIENE CONTRASEÑA'
    END as has_password,
    "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;

-- 4. Verificar que el hash de la contraseña tiene el formato correcto de bcrypt
-- Los hashes de bcrypt empiezan con $2a$, $2b$, o $2y$ y tienen 60 caracteres
SELECT 
    email,
    CASE 
        WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' OR password LIKE '$2y$%' THEN '✅ FORMATO BCrypt CORRECTO'
        ELSE '❌ FORMATO INCORRECTO'
    END as hash_format,
    LENGTH(password) as hash_length
FROM "User"
WHERE email = 'admin@sapiens.com';

-- ============================================
-- SOLUCIÓN: Crear o actualizar usuario admin
-- ============================================
-- Contraseña: admin123
-- Hash generado: $2b$10$m0ue4ciZq3AfUHYkk2B6IOIQX2x.KYEtf6xVI.Opfrst6LIUISEd6

-- OPCIÓN 1: Crear o actualizar el usuario (recomendado)
-- Este SQL crea el usuario si no existe, o actualiza la contraseña si ya existe
INSERT INTO "User" (id, name, email, password, "createdAt", "updatedAt")
VALUES (
    'admin-sapiens-2025',
    'Admin Sapiens',
    'admin@sapiens.com',
    '$2b$10$m0ue4ciZq3AfUHYkk2B6IOIQX2x.KYEtf6xVI.Opfrst6LIUISEd6',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
    password = '$2b$10$m0ue4ciZq3AfUHYkk2B6IOIQX2x.KYEtf6xVI.Opfrst6LIUISEd6',
    "updatedAt" = NOW();

-- OPCIÓN 2: Solo actualizar contraseña (si el usuario ya existe)
-- Descomenta si solo quieres actualizar la contraseña:
-- UPDATE "User"
-- SET 
--     password = '$2b$10$m0ue4ciZq3AfUHYkk2B6IOIQX2x.KYEtf6xVI.Opfrst6LIUISEd6',
--     "updatedAt" = NOW()
-- WHERE email = 'admin@sapiens.com';
