-- Crear segunda base de datos
CREATE DATABASE tenant_forge_2;

-- Conectar a tenant_forge_1 y crear schema sys
\c tenant_forge_1;
CREATE SCHEMA IF NOT EXISTS sys;

-- Conectar a tenant_forge_2 y crear schema sys
\c tenant_forge_2;
CREATE SCHEMA IF NOT EXISTS sys;
