import { sql } from '@/lib/db';
import BookingForm from '@/components/BookingForm';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { rows: servicios } = await sql`SELECT id, nombre, duracion_minutos FROM servicios ORDER BY id`;

  return (
    <main className="min-h-screen bg-[#1C1917] text-[#F5F1EA]">
      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif mb-1">Barbería</h1>
        <p className="text-[#C9A227] mb-8">Reservá tu turno</p>
        <BookingForm servicios={servicios} />
      </div>
    </main>
  );
}