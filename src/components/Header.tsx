import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl tracking-tight">Tula</span>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">estética</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="/#tratamientos" className="text-muted-foreground transition hover:text-foreground">Tratamientos</a>
          <a href="/#reservar" className="text-muted-foreground transition hover:text-foreground">Reservar</a>
          <a href="/#contacto" className="text-muted-foreground transition hover:text-foreground">Contacto</a>
        </nav>
        <a
          href="/#reservar"
          className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Pedir cita
        </a>
      </div>
    </header>
  );
}
