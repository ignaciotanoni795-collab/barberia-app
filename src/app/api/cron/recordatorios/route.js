import { sql } from '@/lib/db';
import { enviarPush } from '@/lib/push';
import { ahoraLocal } from '@/lib/horarios';

export async function GET(request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const hoy = ahoraLocal().fecha;

  const { rows: turnos } = await sql`
    SELECT
      t.id,
      to_char(t.fecha_hora, 'HH24:MI') AS hora,
      ps.id AS sub_id,
      ps.endpoint,
      ps.p256dh,
      ps.auth,
      COALESCE(b.nombre, '') AS barbero_nombre
    FROM turnos t
    JOIN push_subscriptions ps ON ps.id = t.push_subscription_id
    LEFT JOIN barberos b ON b.id = t.barbero_id
    WHERE t.estado <> 'cancelado'
      AND NOT t.recordatorio_enviado
      AND t.fecha_hora::date = ${hoy}::date
  `;

  let enviados = 0;
  for (const t of turnos) {
    const ok = await enviarPush(
      { id: t.sub_id, endpoint: t.endpoint, p256dh: t.p256dh, auth: t.auth },
      {
        title: 'Recordatorio de turno',
        body: `Hoy tenés turno a las ${t.hora}${t.barbero_nombre ? ` con ${t.barbero_nombre}` : ''}.`,
        url: '/',
      }
    );
    await sql`UPDATE turnos SET recordatorio_enviado = true WHERE id = ${t.id}`;
    if (ok) enviados++;
  }

  return Response.json({ turnos: turnos.length, enviados });
}
