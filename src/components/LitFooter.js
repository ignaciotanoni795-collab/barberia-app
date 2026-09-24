const CONTACTO_DEFAULT = 'https://wa.me/5492643172908';

export function LitFirma({ contactoHref = CONTACTO_DEFAULT, conSlogan = true }) {
  return (
    <a
      href={contactoHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Sistema desarrollado por LIT Smart Business"
      className="group inline-flex items-center gap-3 rounded-md px-2 py-1 -mx-2 text-[#F5F1EA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFFFFF]"
    >
      <svg
        viewBox="17 13 109 146"
        className="h-8 w-auto shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none"
        aria-hidden="true"
        focusable="false"
      >
        <polygon points="19,32 49,15 49,107 19,124" fill="currentColor" />
        <polygon points="19,124 49,107 100,137 70,157" fill="currentColor" opacity="0.72" />
        <path d="M66,29 L73,22 L99,40 L66,60 Z" fill="#2d95f5" />
        <path d="M66,60 L99,40 Q104,46 103,57 L102,70 Q100,76 95,78 Z" fill="#0b3f7c" />
        <path d="M66,60 L117,94 Q123,101 124,111 L122,121 Q119,128 114,129 L66,98 Z" fill="#1a73dc" />
      </svg>
      <span className="flex flex-col leading-tight text-left">
        <span className="text-[11px] text-[#8A8378]">Sistema desarrollado por</span>
        <span className="text-sm" style={{ fontFamily: 'var(--font-poppins), ui-sans-serif, system-ui, sans-serif' }}>
          <span className="font-bold tracking-wide">LIT</span> <span className="font-normal">Smart Business</span>
        </span>
        {conSlogan && (
          <span className="text-[11px] text-[#8A8378] transition-colors group-hover:text-[#FFFFFF]">
            Gestión inteligente para negocios reales
          </span>
        )}
      </span>
    </a>
  );
}

export default function LitFooter({ cliente, compacto = false, contactoHref = CONTACTO_DEFAULT }) {
  const anio = new Date().getFullYear();

  if (compacto) {
    return (
      <footer className="flex justify-center py-4">
        <LitFirma contactoHref={contactoHref} conSlogan={false} />
      </footer>
    );
  }

  return (
    <footer className="w-full border-t border-[#3A3530] bg-[#1C1917]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-5 sm:flex-row sm:justify-between">
        <p className="text-center text-xs text-[#8A8378] sm:text-left">
          © {anio} {cliente ?? ''}
          {cliente ? '. ' : ''}Todos los derechos reservados.
        </p>
        <LitFirma contactoHref={contactoHref} />
      </div>
    </footer>
  );
}
