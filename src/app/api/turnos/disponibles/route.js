import { horariosDisponibles } from '@/lib/disponibilidad';
import { esFechaValida } from '@/lib/horarios';

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const fecha = params.get('fecha');
  const duracion = Number(params.get('duracion'));
  const barbero = Number(params.get('barbero'));

  if (
    !esFechaValida(fecha) ||
    !Number.isInteger(duracion) ||
    duracion <= 0 ||
    !Number.isInteger(barbero) ||
    barbero <= 0
  ) {
    return Response.json({ error: 'Parámetros inválidos.' }, { status: 400 });
  }

  return Response.json({ horarios: await horariosDisponibles(fecha, duracion, barbero) });
}
