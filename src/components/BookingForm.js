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

export default function BookingForm({ servicios }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, setResultado] = useState({ clave: null, horarios: [] });
  const [recarga, setRecarga] = useState(0);

  const duracion = servicios
    .filter((s) => seleccionados.includes(s.id))
    .reduce((acc, s) => acc + s.duracion_minutos, 0);

  const clave = fecha && duracion > 0 ? `${fecha}|${duracion}|${recarga}` : null;
  const cargandoHorarios = clave !== null && resultado.clave !== clave;
  const horarios = clave !== null && resultado.clave === clave ? resultado.horarios : [];
  // Si cambian los servicios o la fecha y la hora elegida ya no entra, se descarta.
  const horaElegida = horarios.includes(hora) ? hora : '';

  useEffect(() => {
    if (clave === null) return;

    let cancelado = false;
    fetch(`/api/turnos/disponibles?fecha=${fecha}&duracion=${duracion}`)
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
  }, [clave, fecha, duracion]);

  let placeholderHora = 'Elegí un horario';
  if (duracion === 0) placeholderHora = 'Elegí un servicio primero';
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

    if (!nombre || !telefono || !fecha || !horaElegida || seleccionados.length === 0) {
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