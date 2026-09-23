import { sql } from '@/lib/db';
import { calcularDisponibles } from '@/lib/horarios';

// Turnos no cancelados de `fecha`, como rangos { inicio, fin } en minutos del día.
async function turnosOcupados(fecha) {
  const { rows } = await sql`
    SELECT
      EXTRACT(HOUR FROM t.fecha_hora) * 60 + EXTRACT(MINUTE FROM t.fecha_hora) AS inicio,
      SUM(s.duracion_minutos) AS duracion
    FROM turnos t
    JOIN turno_servicios ts ON ts.turno_id = t.id
    JOIN servicios s ON s.id = ts.servicio_id
    WHERE t.estado <> 'cancelado'
      AND t.fecha_hora::date = ${fecha}::date
    GROUP BY t.id
  `;
  return rows.map((r) => ({
    inicio: Number(r.inicio),
    fin: Number(r.inicio) + Number(r.duracion),
  }));
}

export async function horariosDisponibles(fecha, duracion) {
  return calcularDisponibles(fecha, duracion, await turnosOcupados(fecha));
}
