import { login } from '../actions';

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="min-h-screen bg-[#1C1917] text-[#F5F1EA] flex items-center justify-center px-6">
      <form action={login} className="w-full max-w-sm space-y-4">
        <div className="mb-4">
          <h1 className="text-3xl font-serif mb-1">Barbería</h1>
          <p className="text-[#C9A227]">Panel del dueño</p>
        </div>
        <input
          name="usuario"
          placeholder="Usuario"
          autoComplete="username"
          className="w-full bg-transparent border border-[#3A3530] rounded-md px-4 py-3 placeholder-[#8A8378] focus:outline-none focus:border-[#C9A227]"
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          className="w-full bg-transparent border border-[#3A3530] rounded-md px-4 py-3 placeholder-[#8A8378] focus:outline-none focus:border-[#C9A227]"
        />
        {error && <p className="text-red-400 text-sm">Usuario o contraseña incorrectos.</p>}
        <button
          type="submit"
          className="w-full bg-[#C9A227] text-[#1C1917] font-medium rounded-md py-3"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
