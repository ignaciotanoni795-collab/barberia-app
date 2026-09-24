import { sql } from '@/lib/db';
import AdminNav from '@/components/AdminNav';

export const dynamic = 'force-dynamic';

const TZ = 'America/Argentina/Buenos_Aires';
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function hoyArgentina() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

function sumarDias(fechaStr, dias) {
  const d = new Date(`${fechaStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function lunesDeLaSemana(fechaStr) {
  const d = new Date(`${fechaStr}T00:00:00Z`);
  const dow = d.getUTCDay(); // 0=domingo..6=sábado
  const diff = dow === 0 ? -6 : 1 - dow;
  return sumarDias(fechaStr, diff);
}

function sumarMeses(anio, mes, delta) {
  const d = new Date(Date.UTC(anio, mes - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function money(n) {
  return Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

export default async function AdminDashboard({ searchParams }) {
  const params = await searchParams;
  const hoy = hoyArgentina();
  const lunes = lunesDeLaSemana(hoy);
  const domingo = sumarDias(lunes, 6);

  const mesParam = typeof params?.mes === 'string' ? params.mes : null;
  const [anioMes, mesMes] = (mesParam ?? hoy.slice(0, 7)).split('-').map(Number);
  const inicioMes = `${anioMes}-${String(mesMes).padStart(2, '0')}-01`;
  const finMesDate = new Date(Date.UTC(anioMes, mesMes, 0));
  const finMes = finMesDate.toISOString().slice(0, 10);
  const diasEnMes = finMesDate.getUTCDate();

  const [{ rows: kpiHoy }, { rows: kpiSemana }, { rows: diasMes }, { rows: mejoresDias }, { rows: porBarbero }] = await Promise.all([
    sql`
      SELECT COUNT(DISTINCT t.id) AS turnos, COALESCE(SUM(ts.precio_historico), 0) AS total
      FROM turnos t
      JOIN turno_servicios ts ON ts.turno_id = t.id
      WHERE t.estado <> 'cancelado' AND t.fecha_hora::date = ${hoy}::date
    `,
    sql`
      SELECT COUNT(DISTINCT t.id) AS turnos, COALESCE(SUM(ts.precio_historico), 0) AS total
      FROM turnos t
      JOIN turno_servicios ts ON ts.turno_id = t.id
      WHERE t.estado <> 'cancelado' AND t.fecha_hora::date BETWEEN ${lunes}::date AND ${domingo}::date
    `,
    sql`
      SELECT to_char(t.fecha_hora, 'YYYY-MM-DD') AS fecha, COUNT(DISTINCT t.id) AS turnos, COALESCE(SUM(ts.precio_historico), 0) AS total
      FROM turnos t
      JOIN turno_servicios ts ON ts.turno_id = t.id
      WHERE t.estado <> 'cancelado' AND t.fecha_hora::date BETWEEN ${inicioMes}::date AND ${finMes}::date
      GROUP BY to_char(t.fecha_hora, 'YYYY-MM-DD')
    `,
    sql`
      SELECT EXTRACT(ISODOW FROM t.fecha_hora)::int AS dow, COUNT(DISTINCT t.id) AS turnos, COALESCE(SUM(ts.precio_historico), 0) AS total
      FROM turnos t
      JOIN turno_servicios ts ON ts.turno_id = t.id
      WHERE t.estado <> 'cancelado'
      GROUP BY 1
      ORDER BY total DESC
    `,
    sql`
      SELECT b.id, b.nombre, COUNT(DISTINCT t.id) AS turnos, COALESCE(SUM(ts.precio_historico), 0) AS total
      FROM barberos b
      LEFT JOIN turnos t ON t.barbero_id = b.id
        AND t.estado <> 'cancelado'
        AND t.fecha_hora::date BETWEEN ${inicioMes}::date AND ${finMes}::date
      LEFT JOIN turno_servicios ts ON ts.turno_id = t.id
      WHERE b.activo
      GROUP BY b.id, b.nombre
      ORDER BY total DESC
    `,
  ]);

  const porDia = new Map(diasMes.map((r) => [r.fecha, r]));

  const primerDia = new Date(`${inicioMes}T00:00:00Z`);
  const isoDowPrimerDia = primerDia.getUTCDay() === 0 ? 7 : primerDia.getUTCDay();
  const celdas = [];
  for (let i = 1; i < isoDowPrimerDia; i++) celdas.push(null);
  for (let dia = 1; dia <= diasEnMes; dia++) {
    celdas.push(`${inicioMes.slice(0, 7)}-${String(dia).padStart(2, '0')}`);
  }
  const semanas = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));

  const nombreMes = new Date(Date.UTC(anioMes, mesMes - 1, 1))
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const mesAnterior = sumarMeses(anioMes, mesMes, -1);
  const mesSiguiente = sumarMeses(anioMes, mesMes, 1);

  return (
    <main className="min-h-screen bg-[#1C1917] text-[#F5F1EA]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <AdminNav current="dashboard" />
        <h1 className="text-3xl font-serif mb-1">Dashboard</h1>
        <p className="text-[#FFFFFF] mb-8">Panel del dueño</p>

        <div className="grid grid-cols-2 gap-3 mb-10">
          <div className="border border-[#3A3530] rounded-md px-4 py-3">
            <p className="text-sm text-[#8A8378]">Proyectado de hoy</p>
            <p className="text-2xl mt-1">{money(kpiHoy[0].total)}</p>
            <p className="text-xs text-[#8A8378] mt-1">{kpiHoy[0].turnos} turno(s)</p>
          </div>
          <div className="border border-[#3A3530] rounded-md px-4 py-3">
            <p className="text-sm text-[#8A8378]">Proyectado de la semana</p>
            <p className="text-2xl mt-1">{money(kpiSemana[0].total)}</p>
            <p className="text-xs text-[#8A8378] mt-1">{kpiSemana[0].turnos} turno(s)</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <a href={`/admin?mes=${mesAnterior}`} className="text-sm text-[#8A8378] hover:text-[#F5F1EA]">← Mes anterior</a>
          <p className="capitalize font-medium">{nombreMes}</p>
          <a href={`/admin?mes=${mesSiguiente}`} className="text-sm text-[#8A8378] hover:text-[#F5F1EA]">Mes siguiente →</a>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#8A8378] mb-1">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <div key={d}>{d}</div>)}
        </div>

        <div className="space-y-1 mb-10">
          {semanas.map((semana, i) => (
            <div key={i} className="grid grid-cols-7 gap-1">
              {semana.map((fecha, j) => {
                if (!fecha) return <div key={j} />;
                const info = porDia.get(fecha);
                const esHoy = fecha === hoy;
                return (
                  <a
                    key={fecha}
                    href={`/admin/dia/${fecha}`}
                    className={`border rounded-md px-1 py-2 text-center hover:border-[#FFFFFF] ${
                      esHoy ? 'border-[#FFFFFF]' : 'border-[#3A3530]'
                    }`}
                  >
                    <p className="text-sm">{Number(fecha.slice(8, 10))}</p>
                    {info && (
                      <>
                        <p className="text-[10px] text-[#FFFFFF] mt-1">{info.turnos}</p>
                        <p className="text-[9px] text-[#8A8378] truncate">{money(info.total)}</p>
                      </>
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        <h2 className="text-lg font-serif mb-3">Mejores días de venta</h2>
        {mejoresDias.length === 0 ? (
          <p className="text-[#8A8378] text-sm">Todavía no hay datos suficientes.</p>
        ) : (
          <div className="space-y-2 mb-10">
            {mejoresDias.map((d) => (
              <div key={d.dow} className="flex items-center justify-between border border-[#3A3530] rounded-md px-4 py-2">
                <span>{DIAS[d.dow - 1]}</span>
                <span className="text-sm text-[#8A8378]">{d.turnos} turno(s)</span>
                <span className="text-[#FFFFFF]">{money(d.total)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-serif">Rendimiento por barbero</h2>
          <a href="/admin/barberos" className="text-sm text-[#8A8378] hover:text-[#F5F1EA]">Ver detalle →</a>
        </div>
        <p className="text-xs text-[#8A8378] mb-3 capitalize">{nombreMes}</p>
        {porBarbero.length === 0 ? (
          <p className="text-[#8A8378] text-sm">Todavía no hay barberos cargados.</p>
        ) : (
          <div className="space-y-2">
            {porBarbero.map((b) => (
              <div key={b.id} className="flex items-center justify-between border border-[#3A3530] rounded-md px-4 py-2">
                <span>{b.nombre}</span>
                <span className="text-sm text-[#8A8378]">{b.turnos} turno(s)</span>
                <span className="text-[#FFFFFF]">{money(b.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
