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
    SELECT id, precio FROM servicios WHERE id = ANY(${servicios})
  `;

  if (serviciosDb.length !== servicios.length) {
    return Response.json({ error: 'Algún servicio seleccionado no existe.' }, { status: 400 });
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
