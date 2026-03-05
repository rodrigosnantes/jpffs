-- Este script adiciona as novas colunas à tabela "profiles" para suportar as informações extras dos jogadores.
-- Você pode executar isso no SQL Editor do seu projeto Supabase.

ALTER TABLE profiles
ADD COLUMN nickname text,
ADD COLUMN birth_date date,
ADD COLUMN phone text,
ADD COLUMN age integer,
ADD COLUMN favorite_team text,
ADD COLUMN status text default 'active';
