import { useTreatments } from "@/lib/treatments";
import { AnimatedImage } from "./AnimatedImage";
import { Clock, Loader2 } from "lucide-react";

type Props = { onSelect: (treatmentId: string) => void };

export function Treatments({ onSelect }: Props) {
  const treatments = useTreatments({ onlyActive: true });

  return (
    <section id="tratamientos" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-primary">Carta de tratamientos</span>
        <h2 className="mt-4 font-display text-4xl tracking-tight md:text-5xl">
          Cada detalle, pensado para ti
        </h2>
        <p className="mt-4 text-muted-foreground">
          Tratamientos esenciales con productos cuidadosamente seleccionados.
        </p>
      </div>

      {!treatments ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {treatments.map((t) => (
            <article
              key={t.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:shadow-xl"
            >
              <AnimatedImage
                src={t.image}
                alt={t.name}
                width={800}
                height={800}
                wrapperClassName="aspect-[4/3]"
              />
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl">{t.name}</h3>
                  <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                    {t.price} €
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{t.description}</p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {t.duration} min aprox.
                  </span>
                  <button
                    onClick={() => onSelect(t.id)}
                    className="text-sm font-medium text-primary underline-offset-4 transition hover:underline"
                  >
                    Reservar →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
