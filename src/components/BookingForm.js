'use client';

import { useState, useMemo } from 'react';

export default function BookingForm({ servicios }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const total = useMemo(() => {
    return servicios
      .filter((s) => seleccionados.includes(s.id))
      .reduce((sum, s) => sum + Number(s.precio), 0);
  }, [seleccionados, servicios]);

  function toggleServicio(id) {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje(null);

    if (!nombre || !telefono || !fecha || !hora || seleccionados.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Completá todos los campos y elegí al menos un servicio.' });
      return;
    }

    setEnviando(true);
    try {
      const fecha_hora = `${fecha}T${hora}:00`;
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

      if (!res.ok) throw new Error('No se pudo guardar el turno');

      setMensaje({ tipo: 'ok', texto: '¡Turno reservado! Te esperamos.' });
      setNombre('');
      setTelefono('');
      setFecha('');
      setHora('');
      setSeleccionados([]);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Hubo un problema al reservar. Probá de nuevo.' });
    } finally {
      setEnviando(false);
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
          className="w-full bg-transparent border border-[#3A3530] rounded-md px-4 py-3 placeholder-[#8A8378] focus:outline-none focus:border-[#C9A227]"
        />
        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full bg-transparent border border-[#3A3530] rounded-md px-4 py-3 placeholder-[#8A8378] focus:outline-none focus:border-[#C9A227]"
        />
        <div className="flex gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-1/2 bg-transparent border border-[#3A3530] rounded-md px-4 py-3 focus:outline-none focus:border-[#C9A227]"
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-1/2 bg-transparent border border-[#3A3530] rounded-md px-4 py-3 focus:outline-none focus:border-[#C9A227]"
          />
        </div>
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
                  className="accent-[#C9A227] w-4 h-4"
                />
                <span>
                  {s.nombre} <span className="text-[#8A8378] text-sm">({s.duracion_minutos} min)</span>
                </span>
              </span>
              <span className="text-[#C9A227]">
                {Number(s.precio).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#3A3530] pt-4">
        <span className="text-[#8A8378]">Total</span>
        <span className="text-2xl">
          {total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
        </span>
      </div>

      {mensaje && (
        <p className={mensaje.tipo === 'ok' ? 'text-green-400' : 'text-red-400'}>
          {mensaje.texto}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-[#C9A227] text-[#1C1917] font-medium rounded-md py-3 disabled:opacity-50"
      >
        {enviando ? 'Reservando...' : 'Reservar turno'}
      </button>
    </form>
  );
}