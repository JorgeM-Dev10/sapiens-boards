-- Actualizar URLs de imágenes de avatares según el rango
-- Las URLs directas de Imgur se obtienen de: https://i.imgur.com/[ID].png

UPDATE "BitacoraAvatar"
SET "avatarImageUrl" = 'https://i.imgur.com/ZhsrnvR.png'
WHERE "rank" = 'Principiante';

UPDATE "BitacoraAvatar"
SET "avatarImageUrl" = 'https://i.imgur.com/8sfE7ue.png'
WHERE "rank" = 'Intermedio';

UPDATE "BitacoraAvatar"
SET "avatarImageUrl" = 'https://i.imgur.com/3oUQA6l.png'
WHERE "rank" = 'Avanzado';

UPDATE "BitacoraAvatar"
SET "avatarImageUrl" = 'https://i.imgur.com/CCuILkk.png'
WHERE "rank" = 'Épico';

UPDATE "BitacoraAvatar"
SET "avatarImageUrl" = 'https://i.imgur.com/5WDwPXs.png'
WHERE "rank" = 'Leyenda';

