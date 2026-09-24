'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { sessionToken } from '@/lib/auth';

async function setEstado(id, estado) {
  await sql`UPDATE turnos SET estado = ${estado} WHERE id = ${id}`;
  revalidatePath('/admin', 'layout');
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

export async function cerrarDia(fecha) {
  const { rows } = await sql`
    SELECT COUNT(DISTINCT t.id) AS cantidad, COALESCE(SUM(ts.precio_historico), 0) AS total
    FROM turnos t
    JOIN turno_servicios ts ON ts.turno_id = t.id
    WHERE t.fecha_hora::date = ${fecha}::date AND t.estado = 'completado'
  `;
  const { cantidad, total } = rows[0];

  await sql`
    INSERT INTO cierres (fecha, total, cantidad_turnos)
    VALUES (${fecha}::date, ${total}, ${cantidad})
    ON CONFLICT (fecha) DO UPDATE
      SET total = EXCLUDED.total, cantidad_turnos = EXCLUDED.cantidad_turnos, creado_en = now()
  `;
  revalidatePath('/admin', 'layout');
}

export async function crearBarbero(formData) {
  const nombre = formData.get('nombre')?.trim();
  if (!nombre) return;
  await sql`INSERT INTO barberos (nombre) VALUES (${nombre})`;
  revalidatePath('/admin/barberos');
  revalidatePath('/');
}

export async function editarBarbero(id, formData) {
  const nombre = formData.get('nombre')?.trim();
  if (!nombre) return;
  await sql`UPDATE barberos SET nombre = ${nombre} WHERE id = ${id}`;
  revalidatePath('/admin/barberos');
  revalidatePath('/');
}

export async function toggleBarberoActivo(id, activo) {
  await sql`UPDATE barberos SET activo = ${!activo} WHERE id = ${id}`;
  revalidatePath('/admin/barberos');
  revalidatePath('/');
}

export async function login(formData) {
  const usuario = formData.get('usuario');
  const password = formData.get('password');

  if (usuario !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login?error=1');
  }

  const store = await cookies();
  store.set('admin_session', await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect('/admin');
}

export async function logout() {
  const store = await cookies();
  store.delete('admin_session');
  redirect('/admin/login');
}
