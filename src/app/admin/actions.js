'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';

async function setEstado(id, estado) {
  await sql`UPDATE turnos SET estado = ${estado} WHERE id = ${id}`;
  revalidatePath('/admin');
}

export async function cancelarTurno(id) {
  await setEstado(id, 'cancelado');
}

export async function completarTurno(id) {
  await setEstado(id, 'completado');
}

export async function reabrirTurno(id) {
  await setEstado(id, 'pendiente');
}
