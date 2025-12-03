-- Agregar campo avatarImageUrl a BitacoraAvatar
ALTER TABLE "BitacoraAvatar" 
ADD COLUMN "avatarImageUrl" TEXT;

-- Comentario para documentar el campo
COMMENT ON COLUMN "BitacoraAvatar"."avatarImageUrl" IS 'URL de la imagen del emblema del rango (Principiante, Intermedio, Avanzado, Épico, Leyenda)';

