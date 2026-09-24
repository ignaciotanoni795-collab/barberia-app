CREATE TABLE IF NOT EXISTS barberos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE turnos ADD COLUMN IF NOT EXISTS barbero_id INTEGER REFERENCES barberos(id);

INSERT INTO barberos (nombre)
SELECT nombre FROM (VALUES ('Barbero 1'), ('Barbero 2'), ('Barbero 3')) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM barberos);
