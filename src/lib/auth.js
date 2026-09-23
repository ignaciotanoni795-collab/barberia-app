export async function sessionToken() {
  const data = new TextEncoder().encode(
    `${process.env.ADMIN_USER}:${process.env.ADMIN_PASSWORD}:barberia-admin-session`
  );
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
