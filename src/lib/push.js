import webpush from 'web-push';
import { sql } from '@/lib/db';

webpush.setVapidDetails(
  'mailto:ignaciotanoni795@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Envía una notificación push y borra la suscripción si ya no es válida
// (el navegador la revocó o el usuario desinstaló la app).
export async function enviarPush(suscripcion, payload) {
  try {
    await webpush.sendNotification(
      {
        endpoint: suscripcion.endpoint,
        keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      await sql`DELETE FROM push_subscriptions WHERE id = ${suscripcion.id}`;
    }
    return false;
  }
}
