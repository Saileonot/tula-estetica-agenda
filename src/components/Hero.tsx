import hero from "@/assets/hero.jpg";
import { AnimatedImage } from "./AnimatedImage";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-16 md:grid-cols-2 md:pt-24">
        <div className="space-y-8">
          <span className="inline-flex items-center rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Estética & bienestar
          </span>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Tu ritual de belleza,<br />
            <span className="italic text-primary">a tu medida.</span>
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Tratamientos faciales, corporales y de manos diseñados para cuidarte. Reserva
            tu cita en segundos y elige el hueco que mejor encaje contigo.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#reservar"
              className="inline-flex items-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-md transition hover:bg-primary/90"
            >
              Reservar cita
            </a>
            <a
              href="#tratamientos"
              className="inline-flex items-center rounded-full border border-border bg-background px-7 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              Ver tratamientos
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-secondary via-accent/30 to-transparent blur-2xl float-slow" />
          <AnimatedImage
            src={hero}
            alt="Salón Tula Estética"
            width={1600}
            height={1100}
            wrapperClassName="rounded-[2rem] shadow-2xl aspect-[4/5] md:aspect-[5/6]"
          />
        </div>
      </div>
    </section>
  );
}
