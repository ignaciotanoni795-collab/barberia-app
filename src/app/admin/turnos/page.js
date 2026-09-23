import { sql } from '@/lib/db';
import AdminNav from '@/components/AdminNav';
import { cancelarTurno, completarTurno, reabrirTurno } from '../actions';

export const dynamic = 'force-dynamic';

const ESTADO_COLOR = {
  pendiente: 'text-[#FFFFFF]',
  completado: 'text-green-400',
  cancelado: 'text-red-400',
};

export default async function TurnosPage() {
  const { rows: turnos } = await sql`
    SELECT
      t.id,
      t.nombre_cliente,
      t.telefono_cliente,
      to_char(t.fecha_hora, 'DD/MM/YYYY HH24:MI') AS fecha_hora_fmt,
      t.estado,
      json_agg(
        json_build_object('nombre', s.nombre, 'precio', ts.precio_historico)
        ORDER BY s.nombre
      ) AS servicios,
      SUM(ts.precio_historico) AS total
    FROM turnos t
    JOIN turno_servicios ts ON ts.turno_id = t.id
    JOIN servicios s ON s.id = ts.servicio_id
    GROUP BY t.id
    ORDER BY t.fecha_hora ASC
  `;

  return (
    <main className="min-h-screen bg-[#1C1917] text-[#F5F1EA]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <AdminNav current="turnos" />
        <h1 className="text-3xl font-serif mb-1">Turnos</h1>
        <p className="text-[#FFFFFF] mb-8">Todos los turnos reservados</p>

        {turnos.length === 0 ? (
          <p className="text-[#8A8378]">Todavía no hay turnos reservados.</p>
        ) : (
          <div className="space-y-3">
            {turnos.map((t) => (
              <div key={t.id} className="border border-[#3A3530] rounded-md px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.nombre_cliente}</span>
                  <span className="text-[#FFFFFF]">
                    {Number(t.total).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="text-sm text-[#8A8378] mt-1">
                  {t.fecha_hora_fmt}
                  {' · '}
                  {t.telefono_cliente}
                  {' · '}
                  <span className={`capitalize ${ESTADO_COLOR[t.estado] ?? ''}`}>{t.estado}</span>
                </div>
                <div className="text-sm mt-2">
                  {t.servicios.map((s) => s.nombre).join(', ')}
                </div>

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
