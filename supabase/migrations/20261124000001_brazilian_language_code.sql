-- Books in Brazilian Portuguese were stored with the language code 'pt'.
-- The app now uses 'pt-BR' (and still reads 'pt' for safety until this runs).
update public.books
set language = 'pt-BR'
where language = 'pt';
