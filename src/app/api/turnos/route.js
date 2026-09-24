import { sql } from '@/lib/db';
import { horariosDisponibles } from '@/lib/disponibilidad';
import { esFechaValida } from '@/lib/horarios';

export async function POST(request) {
  const body = await request.json();
  const { nombre_cliente, telefono_cliente, fecha_hora, servicios, barbero_id } = body;

  if (
    !nombre_cliente ||
    !telefono_cliente ||
    typeof fecha_hora !== 'string' ||
    !Array.isArray(servicios) ||
    servicios.length === 0 ||
    !Number.isInteger(barbero_id)
  ) {
    return Response.json({ error: 'Faltan datos requeridos.' }, { status: 400 });
  }

  const { rows: serviciosDb } = await sql`
    SELECT id, precio, duracion_minutos FROM servicios WHERE id = ANY(${servicios})
  `;

  if (serviciosDb.length !== servicios.length) {
    return Response.json({ error: 'Algún servicio seleccionado no existe.' }, { status: 400 });
  }

  const { rows: barberoDb } = await sql`
    SELECT id FROM barberos WHERE id = ${barbero_id} AND activo
  `;
  if (barberoDb.length === 0) {
    return Response.json({ error: 'El barbero seleccionado no existe.' }, { status: 400 });
  }

  const duracionTotal = serviciosDb.reduce((acc, s) => acc + s.duracion_minutos, 0);

  const [fecha, hora] = [fecha_hora.slice(0, 10), fecha_hora.slice(11, 16)];
  if (!esFechaValida(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
    return Response.json({ error: 'Fecha u hora inválida.' }, { status: 400 });
  }

  // Revalida contra la misma lista que ve el cliente: horario de atención,
  // turnos pasados y superposición con otros turnos del mismo barbero.
  const disponibles = await horariosDisponibles(fecha, duracionTotal, barbero_id);
  if (!disponibles.includes(hora)) {
    return Response.json({ error: 'Ese horario ya no está disponible. Elegí otro.' }, { status: 409 });
  }

  // El chequeo de arriba no alcanza si dos clientes confirman al mismo tiempo.
  // Por eso la inserción se hace en una transacción con un lock por día: las
  // reservas de una misma fecha se procesan de a una, y el INSERT solo ocurre
  // si no hay superposición en ese momento.
  const [, { rows: turnoRows }] = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtext(${fecha}))`,
    sql`
      WITH choque AS (
        SELECT t.id
        FROM turnos t
        JOIN turno_servicios ts ON ts.turno_id = t.id
        JOIN servicios s ON s.id = ts.servicio_id
        WHERE t.estado <> 'cancelado'
          AND t.fecha_hora::date = ${fecha}::date
          AND t.barbero_id = ${barbero_id}
        GROUP BY t.id, t.fecha_hora
        HAVING t.fecha_hora < ${fecha_hora}::timestamp + make_interval(mins => ${duracionTotal}::int)
           AND t.fecha_hora + make_interval(mins => SUM(s.duracion_minutos)::int) > ${fecha_hora}::timestamp
      ),
      nuevo AS (
        INSERT INTO turnos (nombre_cliente, telefono_cliente, fecha_hora, barbero_id)
        SELECT ${nombre_cliente}, ${telefono_cliente}, ${fecha_hora}::timestamp, ${barbero_id}
        WHERE NOT EXISTS (SELECT 1 FROM choque)
        RETURNING id
      ),
      detalle AS (
        INSERT INTO turno_servicios (turno_id, servicio_id, precio_historico)
        SELECT nuevo.id, s.id, s.precio
        FROM nuevo, servicios s
        WHERE s.id = ANY(${servicios})
      )
      SELECT id FROM nuevo
    `,
  ]);

  if (turnoRows.length === 0) {
    return Response.json({ error: 'Ese horario ya no está disponible. Elegí otro.' }, { status: 409 });
  }
  const turnoId = turnoRows[0].id;

  return Response.json({ id: turnoId }, { status: 201 });
}
