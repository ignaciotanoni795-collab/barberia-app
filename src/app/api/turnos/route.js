import { sql } from '@/lib/db';

export async function POST(request) {
  const body = await request.json();
  const { nombre_cliente, telefono_cliente, fecha_hora, servicios } = body;

  if (
    !nombre_cliente ||
    !telefono_cliente ||
    !fecha_hora ||
    !Array.isArray(servicios) ||
    servicios.length === 0
  ) {
    return Response.json({ error: 'Faltan datos requeridos.' }, { status: 400 });
  }

  const { rows: serviciosDb } = await sql`
    SELECT id, precio, duracion_minutos FROM servicios WHERE id = ANY(${servicios})
  `;

  if (serviciosDb.length !== servicios.length) {
    return Response.json({ error: 'Algún servicio seleccionado no existe.' }, { status: 400 });
  }

  const duracionTotal = serviciosDb.reduce((acc, s) => acc + s.duracion_minutos, 0);

  const { rows: solapados } = await sql`
    SELECT t.id
    FROM turnos t
    JOIN turno_servicios ts ON ts.turno_id = t.id
    JOIN servicios s ON s.id = ts.servicio_id
    WHERE t.estado <> 'cancelado'
    GROUP BY t.id, t.fecha_hora
    HAVING t.fecha_hora < (${fecha_hora}::timestamp + (${duracionTotal}::text || ' minutes')::interval)
       AND (t.fecha_hora + (SUM(s.duracion_minutos)::text || ' minutes')::interval) > ${fecha_hora}::timestamp
  `;

  if (solapados.length > 0) {
    return Response.json({ error: 'Ese horario ya está ocupado. Elegí otro.' }, { status: 409 });
  }

  const { rows: turnoRows } = await sql`
    INSERT INTO turnos (nombre_cliente, telefono_cliente, fecha_hora)
    VALUES (${nombre_cliente}, ${telefono_cliente}, ${fecha_hora})
    RETURNING id
  `;
  const turnoId = turnoRows[0].id;

  for (const s of serviciosDb) {
    await sql`
      INSERT INTO turno_servicios (turno_id, servicio_id, precio_historico)
      VALUES (${turnoId}, ${s.id}, ${s.precio})
    `;
  }

  return Response.json({ id: turnoId }, { status: 201 });
}
