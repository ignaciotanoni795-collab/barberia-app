// Horario de atención por día de la semana (0 = domingo ... 6 = sábado).
// null = cerrado. Editá acá para cambiar los horarios del local.
export const HORARIO_ATENCION = {
  0: null,
  1: { desde: '09:00', hasta: '21:00' },
  2: { desde: '09:00', hasta: '21:00' },
  3: { desde: '09:00', hasta: '21:00' },
  4: { desde: '09:00', hasta: '21:00' },
  5: { desde: '09:00', hasta: '21:00' },
  6: { desde: '09:00', hasta: '21:00' },
};

// Cada cuántos minutos arranca un turno posible.
export const INTERVALO_MINUTOS = 30;

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

export function aMinutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function aHHMM(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function esFechaValida(fecha) {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(new Date(`${fecha}T00:00:00Z`).getTime());
}

export function horarioDelDia(fecha) {
  const diaSemana = new Date(`${fecha}T00:00:00Z`).getUTCDay();
  return HORARIO_ATENCION[diaSemana];
}

// Fecha (YYYY-MM-DD) y minutos del día actuales en la hora de Argentina,
// sin importar la zona horaria del servidor.
export function ahoraLocal() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA_HORARIA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    minutos: Number(partes.hour) * 60 + Number(partes.minute),
  };
}

// Devuelve los horarios de inicio ("HH:MM") libres para un turno de `duracion`
// minutos en `fecha`, dado los turnos ya ocupados ({ inicio, fin } en minutos).
export function calcularDisponibles(fecha, duracion, ocupados) {
  const horario = horarioDelDia(fecha);
  if (!horario) return [];

  const ahora = ahoraLocal();
  if (fecha < ahora.fecha) return [];

  const apertura = aMinutos(horario.desde);
  const cierre = aMinutos(horario.hasta);
  const libres = [];

  for (let inicio = apertura; inicio + duracion <= cierre; inicio += INTERVALO_MINUTOS) {
    if (fecha === ahora.fecha && inicio <= ahora.minutos) continue;
    const fin = inicio + duracion;
    const choca = ocupados.some((o) => o.inicio < fin && o.fin > inicio);
    if (!choca) libres.push(aHHMM(inicio));
  }

  return libres;
}
