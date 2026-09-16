-- Recherche insensible aux accents (REBUILD.md T3.4).
-- 191 noms de marque sur 903 portent un accent. La saisie etait desaccentuee, jamais
-- la colonne : « creme » ne trouvait pas « CRÈME BRÛLÉE ». unaccent() permet de
-- comparer les deux cotes sous la meme forme. Extension contrib, presente dans
-- l'image postgres:16 et dans le PostgreSQL Homebrew.
CREATE EXTENSION IF NOT EXISTS "unaccent";
