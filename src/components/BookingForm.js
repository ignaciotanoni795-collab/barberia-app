'use client';

import { useEffect, useState } from 'react';

function hoyLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function fechaLarga(fecha) {
  const texto = new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function BookingForm({ servicios, barberos }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [barberoId, setBarberoId] = useState(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, setResultado] = useState({ clave: null, horarios: [] });
  const [recarga, setRecarga] = useState(0);
  const [notifActiva, setNotifActiva] = useState(false);
  const [notifCargando, setNotifCargando] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [pushSub, setPushSub] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          setPushSub(sub.toJSON());
          setNotifActiva(true);
        }
      })
      .catch(() => {});
  }, []);

  async function alternarNotificaciones(activar) {
    if (!activar) {
      setNotifActiva(false);
      setPushSub(null);
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setNotifError('Tu navegador no soporta notificaciones push.');
      return;
    }

    setNotifCargando(true);
    setNotifError('');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        });
      }
      setPushSub(sub.toJSON());
      setNotifActiva(true);
    } catch (err) {
      setNotifError('No pudimos activar las notificaciones. Revisá los permisos del navegador.');
      setNotifActiva(false);
    } finally {
      setNotifCargando(false);
    }
  }

  const duracion = servicios
    .filter((s) => seleccionados.includes(s.id))
    .reduce((acc, s) => acc + s.duracion_minutos, 0);

  const clave = barberoId && fecha && duracion > 0 ? `${barberoId}|${fecha}|${duracion}|${recarga}` : null;
  const cargandoHorarios = clave !== null && resultado.clave !== clave;
  const horarios = clave !== null && resultado.clave === clave ? resultado.horarios : [];
  // Si cambian los servicios, el barbero o la fecha y la hora elegida ya no entra, se descarta.
  const horaElegida = horarios.includes(hora) ? hora : '';

  useEffect(() => {
    if (clave === null) return;

    let cancelado = false;
    fetch(`/api/turnos/disponibles?fecha=${fecha}&duracion=${duracion}&barbero=${barberoId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelado) setResultado({ clave, horarios: data.horarios || [] });
      })
      .catch(() => {
        if (!cancelado) setResultado({ clave, horarios: [] });
      });
    return () => {
      cancelado = true;
    };
  }, [clave, fecha, duracion, barberoId]);

  let placeholderHora = 'Elegí un horario';
  if (duracion === 0) placeholderHora = 'Elegí un servicio primero';
  else if (!barberoId) placeholderHora = 'Elegí un barbero primero';
  else if (!fecha) placeholderHora = 'Elegí una fecha primero';
  else if (cargandoHorarios) placeholderHora = 'Buscando horarios...';
  else if (horarios.length === 0) placeholderHora = 'No hay horarios libres ese día';

  function toggleServicio(id) {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    setMensaje(null);

    if (!nombre || !telefono || !barberoId || !fecha || !horaElegida || seleccionados.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Completá todos los campos y elegí al menos un servicio.' });
      return;
    }

    setConfirmando(true);
  }

  async function confirmarReserva() {
    setEnviando(true);
    try {
      const fecha_hora = `${fecha}T${horaElegida}:00`;
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_cliente: nombre,
          telefono_cliente: telefono,
          fecha_hora,
          servicios: seleccionados,
          barbero_id: barberoId,
          push_subscription: pushSub,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: data.error || 'Hubo un problema al reservar. Probá de nuevo.' });
        if (res.status === 409) setRecarga((n) => n + 1);
        return;
      }

      setMensaje({ tipo: 'ok', texto: '¡Turno reservado! Te esperamos.' });
      setNombre('');
      setTelefono('');
      setBarberoId(null);
      setFecha('');
      setHora('');
      setSeleccionados([]);
      setRecarga((n) => n + 1);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Hubo un problema al reservar. Probá de nuevo.' });
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Nombre y apellido"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full bg-transparent border border-[#3A3530] rounded-md px-4 py-3 placeholder-[#8A8378] focus:outline-none focus:border-[#FFFFFF]"
        />
        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full bg-transparent border border-[#3A3530] rounded-md px-4 py-3 placeholder-[#8A8378] focus:outline-none focus:border-[#FFFFFF]"
        />
      </div>

      <div>
        <p className="text-sm text-[#8A8378] mb-3">Servicios</p>
        <div className="space-y-2">
          {servicios.map((s) => (
            <label
              key={s.id}
              className="flex items-center justify-between border border-[#3A3530] rounded-md px-4 py-3 cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={seleccionados.includes(s.id)}
                  onChange={() => toggleServicio(s.id)}
                  className="accent-[#FFFFFF] w-4 h-4"
                />
                <span>
                  {s.nombre} <span className="text-[#8A8378] text-sm">({s.duracion_minutos} min)</span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-[#8A8378] mb-3">Barbero</p>
        <div className="grid grid-cols-3 gap-2">
          {barberos.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBarberoId(b.id)}
              className={`border rounded-md px-3 py-3 text-sm text-center ${
                barberoId === b.id ? 'border-[#FFFFFF]' : 'border-[#3A3530] text-[#8A8378]'
              }`}
            >
              {b.nombre}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-[#8A8378] mb-3">Día y horario</p>
        <div className="flex gap-3">
          <input
            type="date"
            value={fecha}
            min={hoyLocal()}
            suppressHydrationWarning
            onChange={(e) => setFecha(e.target.value)}
            className="w-1/2 bg-transparent border border-[#3A3530] rounded-md px-4 py-3 focus:outline-none focus:border-[#FFFFFF]"
          />
          <select
            value={horaElegida}
            onChange={(e) => setHora(e.target.value)}
            disabled={cargandoHorarios || horarios.length === 0}
            className="w-1/2 bg-[#1C1917] border border-[#3A3530] rounded-md px-4 py-3 focus:outline-none focus:border-[#FFFFFF] disabled:text-[#8A8378]"
          >
            <option value="">{placeholderHora}</option>
            {horarios.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-3 border border-[#3A3530] rounded-md px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={notifActiva}
            disabled={notifCargando}
            onChange={(e) => alternarNotificaciones(e.target.checked)}
            className="accent-[#FFFFFF] w-4 h-4"
          />
          <span className="text-sm">
            Avisarme por notificación (confirmación y recordatorio del turno)
          </span>
        </label>
        {notifError && <p className="text-red-400 text-sm mt-2">{notifError}</p>}
      </div>

      {mensaje && (
        <p className={mensaje.tipo === 'ok' ? 'text-green-400' : 'text-red-400'}>
          {mensaje.texto}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-[#FFFFFF] text-[#1C1917] font-medium rounded-md py-3 disabled:opacity-50"
      >
        Reservar turno
      </button>

      {confirmando && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmar-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
        >
          <div className="w-full max-w-sm bg-[#1C1917] border border-[#3A3530] rounded-md p-6 space-y-5">
            <h2 id="confirmar-titulo" className="text-2xl font-serif">
              ¿Confirmás tu turno?
            </h2>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[#8A8378]">Barbero</dt>
                <dd className="text-base">{barberos.find((b) => b.id === barberoId)?.nombre}</dd>
              </div>
              <div>
                <dt className="text-[#8A8378]">Día y hora</dt>
                <dd className="text-base">
                  {fechaLarga(fecha)} · {horaElegida} hs
                </dd>
              </div>
              <div>
                <dt className="text-[#8A8378]">Servicios</dt>
                <dd className="text-base">
                  {servicios
                    .filter((s) => seleccionados.includes(s.id))
                    .map((s) => s.nombre)
                    .join(', ')}{' '}
                  <span className="text-[#8A8378] text-sm">({duracion} min)</span>
                </dd>
              </div>
              <div>
                <dt className="text-[#8A8378]">A nombre de</dt>
                <dd className="text-base">
                  {nombre} · {telefono}
                </dd>
              </div>
            </dl>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                disabled={enviando}
                className="w-1/2 border border-[#3A3530] rounded-md py-3 disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarReserva}
                disabled={enviando}
                className="w-1/2 bg-[#FFFFFF] text-[#1C1917] font-medium rounded-md py-3 disabled:opacity-50"
              >
                {enviando ? 'Reservando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}