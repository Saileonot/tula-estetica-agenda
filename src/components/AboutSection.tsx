import tulaAbout from "@/assets/tula-about.jpg";
import { AnimatedImage } from "./AnimatedImage";

export function AboutSection() {
  return (
    <section id="sobre-tula" className="bg-secondary/30 py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2">
        <div className="relative order-2 md:order-1">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-accent/30 via-secondary to-transparent blur-2xl" />
          <AnimatedImage
            src={tulaAbout}
            alt="Tula, especialista en estética y bienestar"
            wrapperClassName="rounded-[2rem] shadow-2xl aspect-[4/5]"
          />
        </div>

        <div className="order-1 space-y-6 md:order-2">
          <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            ¿Quién es Tula?
          </span>
          <h2 className="font-display text-4xl leading-tight tracking-tight md:text-5xl">
            Más de 12 años cuidando<br />
            <span className="italic text-primary">de tu bienestar.</span>
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Con más de 12 años de experiencia en el mundo de la estética y el bienestar,
              Tula ha dedicado su trayectoria profesional al cuidado personal, combinando
              técnica, cercanía y atención individualizada.
            </p>
            <p>
              A lo largo de su carrera ha trabajado durante tres años en un centro de
              estética en Tenerife y posteriormente varios años en un centro estético en
              Nervión, ampliando su experiencia en tratamientos corporales y faciales.
            </p>
            <p>
              Está especializada en <strong className="text-foreground">maderoterapia</strong> y
              en <strong className="text-foreground">drenaje linfático facial y corporal</strong>,
              tratamientos orientados tanto al bienestar físico como a la mejora estética
              de forma natural y saludable.
            </p>
            <p>
              Además de su experiencia técnica, destaca por su sensibilidad y excelente
              trato con personas que valoran la calma, la cercanía y un cuidado
              especialmente atento.
            </p>
            <p>
              Para Tula, la estética no consiste únicamente en realizar tratamientos. Su
              objetivo es acompañar a cada persona en el proceso de sentirse mejor consigo
              misma, ayudando a reforzar la autoestima, el bienestar y el amor propio.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
