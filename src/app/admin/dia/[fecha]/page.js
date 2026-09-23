import { sql } from '@/lib/db';
import AdminNav from '@/components/AdminNav';
import { cancelarTurno, completarTurno, reabrirTurno, cerrarDia } from '../../actions';

export const dynamic = 'force-dynamic';

const ESTADO_COLOR = {
  pendiente: 'text-[#C9A227]',
  completado: 'text-green-400',
  cancelado: 'text-red-400',
};

function money(n) {
  return Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

export default async function DiaPage({ params }) {
  const { fecha } = await params;

  const [{ rows: turnos }, { rows: cierreRows }] = await Promise.all([
    sql`
      SELECT
        t.id,
        t.nombre_cliente,
        t.telefono_cliente,
        to_char(t.fecha_hora, 'HH24:MI') AS hora,
        t.estado,
        json_agg(
          json_build_object('nombre', s.nombre)
          ORDER BY s.nombre
        ) AS servicios,
        SUM(ts.precio_historico) AS total
      FROM turnos t
      JOIN turno_servicios ts ON ts.turno_id = t.id
      JOIN servicios s ON s.id = ts.servicio_id
      WHERE t.fecha_hora::date = ${fecha}::date
      GROUP BY t.id
      ORDER BY t.fecha_hora ASC
    `,
    sql`
      SELECT total, cantidad_turnos, to_char(creado_en, 'DD/MM/YYYY HH24:MI') AS creado_en_fmt
      FROM cierres WHERE fecha = ${fecha}::date
    `,
  ]);

  const cierre = cierreRows[0];
  const completados = turnos.filter((t) => t.estado === 'completado');
  const totalCompletado = completados.reduce((acc, t) => acc + Number(t.total), 0);

  const fechaFmt = new Date(`${fecha}T00:00:00Z`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <main className="min-h-screen bg-[#1C1917] text-[#F5F1EA]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <AdminNav current="dashboard" />
        <a href="/admin" className="text-sm text-[#8A8378] hover:text-[#F5F1EA]">← Volver al dashboard</a>
        <h1 className="text-3xl font-serif mt-2 mb-1 capitalize">{fechaFmt}</h1>
        <p className="text-[#C9A227] mb-8">
          {turnos.length} turno{turnos.length !== 1 ? 's' : ''}
        </p>

        <div className="border border-[#3A3530] rounded-md px-4 py-4 mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#8A8378]">Cierre del día</p>
              <p className="text-2xl mt-1">{money(totalCompletado)}</p>
              <p className="text-xs text-[#8A8378] mt-1">{completados.length} turno(s) completado(s)</p>
            </div>
            <form action={cerrarDia.bind(null, fecha)}>
              <button className="text-sm border border-[#C9A227] text-[#C9A227] rounded-md px-4 py-2 hover:bg-[#C9A227]/10 whitespace-nowrap">
                {cierre ? 'Actualizar cierre' : 'Cerrar día'}
              </button>
            </form>
          </div>
          {cierre && (
            <p className="text-xs text-[#8A8378] mt-3">
              Cerrado el {cierre.creado_en_fmt} por {money(cierre.total)} ({cierre.cantidad_turnos} turnos)
            </p>
          )}
        </div>

        {turnos.length === 0 ? (
          <p className="text-[#8A8378]">No hay turnos este día.</p>
        ) : (
          <div className="space-y-3">
            {turnos.map((t) => (
              <div key={t.id} className="border border-[#3A3530] rounded-md px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.hora} · {t.nombre_cliente}</span>
                  <span className="text-[#C9A227]">{money(t.total)}</span>
                </div>
                <div className="text-sm text-[#8A8378] mt-1">
                  {t.telefono_cliente}
                  {' · '}
                  <span className={`capitalize ${ESTADO_COLOR[t.estado] ?? ''}`}>{t.estado}</span>
                </div>
                <div className="text-sm mt-2">{t.servicios.map((s) => s.nombre).join(', ')}</div>

                <div className="flex gap-2 mt-3">
                  {t.estado === 'pendiente' && (
                    <>
                      <form action={completarTurno.bind(null, t.id)}>
                        <button className="text-sm border border-green-400 text-green-400 rounded-md px-3 py-1 hover:bg-green-400/10">
                          Marcar completado
                        </button>
                      </form>
                      <form action={cancelarTurno.bind(null, t.id)}>
                        <button className="text-sm border border-red-400 text-red-400 rounded-md px-3 py-1 hover:bg-red-400/10">
                          Cancelar
                        </button>
                      </form>
                    </>
                  )}
                  {t.estado !== 'pendiente' && (
                    <form action={reabrirTurno.bind(null, t.id)}>
                      <button className="text-sm border border-[#3A3530] text-[#8A8378] rounded-md px-3 py-1 hover:bg-white/5">
                        Reabrir
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
