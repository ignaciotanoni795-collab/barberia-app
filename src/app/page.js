import { sql } from '@/lib/db';
import BookingForm from '@/components/BookingForm';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [{ rows: servicios }, { rows: barberos }] = await Promise.all([
    sql`SELECT id, nombre, duracion_minutos FROM servicios ORDER BY id`,
    sql`SELECT id, nombre FROM barberos WHERE activo ORDER BY id`,
  ]);

  return (
    <main
      className="min-h-screen bg-[#1C1917] text-[#F5F1EA] bg-cover bg-center"
      style={{ backgroundImage: "linear-gradient(rgba(28,25,23,0.75), rgba(28,25,23,0.85)), url('/otto-logo-bg.webp')" }}
    >
      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif mb-1">Otto Barbería</h1>
        <p className="text-[#FFFFFF] mb-8">Reservá tu turno</p>
        <BookingForm servicios={servicios} barberos={barberos} />
      </div>
    </main>
  );
}