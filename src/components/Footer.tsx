export function Footer() {
  return (
    <footer id="contacto" className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl">Tula estética</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Belleza y bienestar con un trato cercano y profesional.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Horario</p>
          <p className="mt-2 text-muted-foreground">Lunes – Sábado<br />10:00 – 19:00</p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Contacto</p>
          <p className="mt-2 text-muted-foreground">
            tula@estetica.com<br />
            +34 600 000 000
          </p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Tula estética. Hecho con cariño.
        <span className="mx-2">·</span>
        <a href="/auth" className="underline hover:text-foreground">Acceso de Tula</a>
      </div>
    </footer>
  );
}
