import { sql } from '@/lib/db';
import AdminNav from '@/components/AdminNav';
import { crearBarbero, editarBarbero, toggleBarberoActivo } from '../actions';

export const dynamic = 'force-dynamic';

const TZ = 'America/Argentina/Buenos_Aires';

function hoyArgentina() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

function money(n) {
  return Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

export default async function BarberosPage() {
  const hoy = hoyArgentina();
  const [anio, mes] = hoy.slice(0, 7).split('-').map(Number);
  const inicioMes = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const finMes = new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);

  const { rows: barberos } = await sql`
    SELECT
      b.id,
      b.nombre,
      b.activo,
      COUNT(DISTINCT t.id) FILTER (WHERE t.estado = 'completado') AS turnos_completados,
      COALESCE(SUM(ts.precio_historico) FILTER (WHERE t.estado = 'completado'), 0) AS total_completado,
      COUNT(DISTINCT t.id) FILTER (
        WHERE t.estado <> 'cancelado' AND t.fecha_hora::date BETWEEN ${inicioMes}::date AND ${finMes}::date
      ) AS turnos_mes,
      COALESCE(SUM(ts.precio_historico) FILTER (
        WHERE t.estado <> 'cancelado' AND t.fecha_hora::date BETWEEN ${inicioMes}::date AND ${finMes}::date
      ), 0) AS total_mes
    FROM barberos b
    LEFT JOIN turnos t ON t.barbero_id = b.id
    LEFT JOIN turno_servicios ts ON ts.turno_id = t.id
    GROUP BY b.id, b.nombre, b.activo
    ORDER BY b.activo DESC, b.id ASC
  `;

  return (
    <main className="min-h-screen bg-[#1C1917] text-[#F5F1EA]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <AdminNav current="barberos" />
        <h1 className="text-3xl font-serif mb-1">Barberos</h1>
        <p className="text-[#FFFFFF] mb-8">Personal y su rendimiento</p>

        <form action={crearBarbero} className="flex gap-2 mb-8">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre del nuevo barbero"
            required
            className="flex-1 bg-transparent border border-[#3A3530] rounded-md px-4 py-3 placeholder-[#8A8378] focus:outline-none focus:border-[#FFFFFF]"
          />
          <button
            type="submit"
            className="bg-[#FFFFFF] text-[#1C1917] font-medium rounded-md px-4 py-3 whitespace-nowrap"
          >
            Agregar
          </button>
        </form>

        <div className="space-y-3">
          {barberos.map((b) => (
            <div key={b.id} className="border border-[#3A3530] rounded-md px-4 py-4">
              <div className="flex items-center gap-2">
                <form action={editarBarbero.bind(null, b.id)} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    name="nombre"
                    defaultValue={b.nombre}
                    required
                    className="flex-1 bg-transparent border border-[#3A3530] rounded-md px-3 py-2 focus:outline-none focus:border-[#FFFFFF]"
                  />
                  <button
                    type="submit"
                    className="text-sm border border-[#3A3530] rounded-md px-3 py-2 hover:bg-white/5"
                  >
                    Guardar
                  </button>
                </form>
                <form action={toggleBarberoActivo.bind(null, b.id, b.activo)}>
                  <button
                    className={`text-sm border rounded-md px-3 py-2 whitespace-nowrap ${
                      b.activo
                        ? 'border-red-400 text-red-400 hover:bg-red-400/10'
                        : 'border-green-400 text-green-400 hover:bg-green-400/10'
                    }`}
                  >
                    {b.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </form>
              </div>

              {!b.activo && <p className="text-xs text-[#8A8378] mt-2">Inactivo · no aparece en la reserva online</p>}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="border border-[#3A3530] rounded-md px-3 py-2">
                  <p className="text-xs text-[#8A8378]">Este mes</p>
                  <p className="text-lg mt-1">{money(b.total_mes)}</p>
                  <p className="text-xs text-[#8A8378] mt-1">{b.turnos_mes} turno(s)</p>
                </div>
                <div className="border border-[#3A3530] rounded-md px-3 py-2">
                  <p className="text-xs text-[#8A8378]">Histórico completado</p>
                  <p className="text-lg mt-1">{money(b.total_completado)}</p>
                  <p className="text-xs text-[#8A8378] mt-1">{b.turnos_completados} turno(s)</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
