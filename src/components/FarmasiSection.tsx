import { Sparkles, ExternalLink, ShoppingBag, Truck } from "lucide-react";
import farmasiLogo from "@/assets/farmasi-logo.png";
import paprikaChili from "@/assets/farmasi-paprika-chili.webp";

const FARMASI_URL = "https://www.farmasi.es/tulacira";

export function FarmasiSection() {
  return (
    <section id="farmasi" className="relative overflow-hidden border-y border-border bg-gradient-to-br from-accent/30 via-secondary/40 to-background py-24">
      <div className="absolute inset-0 -z-10 opacity-50">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Tienda oficial Farmasi
          </span>
          <img
            src={farmasiLogo}
            alt="Farmasi - be well"
            className="h-16 w-auto md:h-20"
          />
          <h2 className="font-display text-4xl tracking-tight md:text-5xl">
            Llévate la cosmética que <span className="italic text-primary">Tula</span> usa contigo a casa
          </h2>
          <p className="max-w-lg text-muted-foreground">
            Tula es <strong className="text-foreground">vendedora oficial de Farmasi</strong>. Descubre el catálogo
            completo de cuidado facial, corporal, maquillaje y perfumería, y compra online directamente desde su tienda
            personal con envío a toda España.
          </p>

          <ul className="grid gap-3 text-sm">
            <li className="flex items-center gap-3 text-muted-foreground">
              <ShoppingBag className="h-4 w-4 text-primary" /> Catálogo completo de productos Farmasi
            </li>
            <li className="flex items-center gap-3 text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" /> Envío a domicilio en toda España
            </li>
            <li className="flex items-center gap-3 text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Asesoramiento personalizado de Tula
            </li>
          </ul>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={FARMASI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-md transition hover:bg-primary/90"
            >
              Visitar tienda Farmasi <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="#reservar"
              className="inline-flex items-center rounded-full border border-border bg-background px-7 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              Consultar a Tula
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            Al pulsar serás redirigida a la tienda oficial farmasi.es/tulacira.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-secondary to-transparent blur-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/30 to-accent/30 p-6 shadow-lg backdrop-blur">
              <div className="flex h-full flex-col justify-between">
                <span className="text-xs uppercase tracking-[0.25em] text-foreground/70">Skincare</span>
                <p className="font-display text-2xl leading-tight">Cuidado facial</p>
              </div>
            </div>
            <div className="mt-8 aspect-square rounded-3xl bg-gradient-to-br from-accent/40 to-secondary p-6 shadow-lg backdrop-blur">
              <div className="flex h-full flex-col justify-between">
                <span className="text-xs uppercase tracking-[0.25em] text-foreground/70">Make up</span>
                <p className="font-display text-2xl leading-tight">Maquillaje</p>
              </div>
            </div>
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-secondary to-primary/20 p-6 shadow-lg backdrop-blur">
              <div className="flex h-full flex-col justify-between">
                <span className="text-xs uppercase tracking-[0.25em] text-foreground/70">Body</span>
                <p className="font-display text-2xl leading-tight">Cuerpo</p>
              </div>
            </div>
            <a
              href="https://www.farmasi.es/tulacira/product-detail/beauty-shot-collagen?pid=1002122"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 aspect-square rounded-3xl bg-gradient-to-br from-primary/40 to-accent/20 p-6 shadow-lg backdrop-blur transition hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex h-full flex-col justify-between">
                <span className="text-xs uppercase tracking-[0.25em] text-foreground/70">Nutriplus</span>
                <div>
                  <p className="font-display text-2xl leading-tight">Beauty Shot Collagen</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition group-hover:opacity-100">
                    Comprar <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
