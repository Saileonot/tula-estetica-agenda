function InstagramLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ig-grad1" cx="0" cy="0" r="22" gradientUnits="userSpaceOnUse" gradientTransform="translate(4 20) scale(21 19)">
          <stop offset="0.09" stopColor="#f38334" />
          <stop offset="0.78" stopColor="#da3073" />
        </radialGradient>
        <radialGradient id="ig-grad2" cx="0" cy="0" r="22" gradientUnits="userSpaceOnUse" gradientTransform="translate(18.5 3) scale(19 16)">
          <stop offset="0.28" stopColor="#7931a8" />
          <stop offset="1" stopColor="#da3073" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="5.5" fill="url(#ig-grad1)" />
      <rect width="24" height="24" rx="5.5" fill="url(#ig-grad2)" />
      <circle cx="12" cy="12" r="4.8" stroke="white" strokeWidth="1.6" />
      <circle cx="17.7" cy="6.3" r="1.1" fill="white" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer id="contacto" className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl">Tula estética</p>
          <p className="mt-3 text-sm text-muted-foreground">Belleza y bienestar con un trato cercano y profesional.</p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Horario</p>
          <p className="mt-2 text-muted-foreground">
            Lunes – Sábado
            <br />
            10:00 – 19:00
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Contacto</p>
          <div className="mt-2 space-y-1 text-muted-foreground">
            <a
              href="https://instagram.com/tulaestheticbeauty"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-foreground transition"
            >
              <InstagramLogo className="h-5 w-5" />
              <span>@tulaestheticbeauty</span>
            </a>
            <p>+34 682 134 196</p>
            <p>Te atiendo en: C/Mirto 2, Las Pajanosas, Sevilla</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Tula estética. Hecho con cariño.
        <span className="mx-2">·</span>
        <a href="/auth" className="underline hover:text-foreground">
          Acceso de Tula
        </a>
      </div>
    </footer>
  );
}
