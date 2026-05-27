import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { addDays, addMinutes, format, isSameDay, startOfDay } from "date-fns";
import { es } from "date-fns/locale/es";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useTreatments, type Treatment } from "@/lib/treatments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Clock, Loader2, CheckCircle2 } from "lucide-react";

const SLOT_MINUTES = 30;
const DAYS_AHEAD = 14;

type Range = { open: string; close: string };
type DayHours = { morning: Range | null; afternoon: Range | null; closed: boolean };


const phoneRegex = /^[+0-9\s]{6,20}$/;

const formSchema = z.object({
  name: z.string().trim().min(2, "Introduce tu nombre").max(80),
  phone: z.string().trim().regex(phoneRegex, "Teléfono no válido"),
});

type Busy = { slot_at: string; duration_minutes: number };

type Props = {
  initialTreatmentId?: string;
};

export function BookingSection({ initialTreatmentId }: Props) {
  const treatments = useTreatments({ onlyActive: true });
  const [treatmentId, setTreatmentId] = useState<string | null>(initialTreatmentId ?? null);
  const [selectedDay, setSelectedDay] = useState<Date>(() => startOfDay(addDays(new Date(), 1)));
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [busy, setBusy] = useState<Busy[]>([]);
  const [loadingBusy, setLoadingBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  // Horario semanal de Tula (clave = day_of_week 0..6)
  const [hoursByDay, setHoursByDay] = useState<Record<number, { open: string; close: string; closed: boolean }>>({});

  useEffect(() => {
    if (initialTreatmentId) setTreatmentId(initialTreatmentId);
  }, [initialTreatmentId]);

  // Cuando se cargan los tratamientos, asegurar selección por defecto
  useEffect(() => {
    if (treatments && treatments.length > 0 && !treatments.some((t) => t.id === treatmentId)) {
      setTreatmentId(treatments[0].id);
    }
  }, [treatments, treatmentId]);

  const treatment: Treatment | null =
    treatments?.find((t) => t.id === treatmentId) ?? null;

  // Cargar horario semanal una vez
  useEffect(() => {
    (async () => {
      const sb = await getSupabaseClient();
      const { data } = await sb.from("working_hours").select("day_of_week, open_time, close_time, is_closed");
      const map: Record<number, { open: string; close: string; closed: boolean }> = {};
      (data ?? []).forEach((h: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }) => {
        map[h.day_of_week] = { open: h.open_time, close: h.close_time, closed: h.is_closed };
      });
      setHoursByDay(map);
    })();
  }, []);

  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i + 1));
  }, []);

  // Reset selected slot when day or treatment changes
  useEffect(() => { setSelectedSlot(null); }, [selectedDay, treatmentId]);

  // Fetch busy slots for the selected day
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingBusy(true);
      const from = startOfDay(selectedDay).toISOString();
      const to = addDays(startOfDay(selectedDay), 1).toISOString();
      const { data, error } = await (await getSupabaseClient()).rpc("get_busy_slots", { _from: from, _to: to });
      if (cancelled) return;
      if (error) {
        console.error(error);
        setBusy([]);
      } else {
        setBusy((data as Busy[]) ?? []);
      }
      setLoadingBusy(false);
    }
    load();
    return () => { cancelled = true; };
  }, [selectedDay]);

  // Generate slot grid for that day, según horario semanal
  const dayClosed = useMemo(() => {
    const h = hoursByDay[selectedDay.getDay()];
    return h?.closed ?? false;
  }, [hoursByDay, selectedDay]);

  const slots = useMemo(() => {
    if (dayClosed || !treatment) return [];
    const h = hoursByDay[selectedDay.getDay()];
    const openStr = h?.open ?? DEFAULT_OPEN;
    const closeStr = h?.close ?? DEFAULT_CLOSE;
    const [oh, om] = openStr.split(":").map(Number);
    const [ch, cm] = closeStr.split(":").map(Number);
    const result: { time: Date; available: boolean }[] = [];
    const dayStart = startOfDay(selectedDay);
    const open = addMinutes(dayStart, oh * 60 + om);
    const close = addMinutes(dayStart, ch * 60 + cm);
    let t = open;
    const now = new Date();
    while (addMinutes(t, treatment.duration) <= close) {
      const slotEnd = addMinutes(t, treatment.duration);
      const conflict = busy.some((b) => {
        const bStart = new Date(b.slot_at);
        const bEnd = addMinutes(bStart, b.duration_minutes);
        return t < bEnd && slotEnd > bStart;
      });
      const inPast = t <= now;
      result.push({ time: new Date(t), available: !conflict && !inPast });
      t = addMinutes(t, SLOT_MINUTES);
    }
    return result;
  }, [selectedDay, busy, treatment, hoursByDay, dayClosed]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !treatment) {
      toast.error("Elige un horario disponible");
      return;
    }
    const parsed = formSchema.safeParse({ name, phone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!selectedSlot || !treatment) return;
    const parsed = formSchema.safeParse({ name, phone });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await (await getSupabaseClient()).from("appointments").insert({
      client_name: parsed.data.name,
      client_phone: parsed.data.phone,
      treatment: treatment.name,
      duration_minutes: treatment.duration,
      price_eur: treatment.price,
      slot_at: selectedSlot.toISOString(),
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo enviar tu solicitud. Inténtalo de nuevo.");
      console.error(error);
      return;
    }
    toast.success("¡Solicitud enviada! Tula te confirmará por WhatsApp.");
    setConfirmOpen(false);
    setName(""); setPhone(""); setSelectedSlot(null);
    // refresh busy list
    const from = startOfDay(selectedDay).toISOString();
    const to = addDays(startOfDay(selectedDay), 1).toISOString();
    const { data } = await (await getSupabaseClient()).rpc("get_busy_slots", { _from: from, _to: to });
    setBusy((data as Busy[]) ?? []);
  }

  if (!treatments || !treatment) {
    return (
      <section id="reservar" className="bg-secondary/40 py-24">
        <div className="mx-auto flex max-w-5xl justify-center px-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </section>
    );
  }


  return (
    <section id="reservar" className="bg-secondary/40 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">Reserva tu cita</span>
          <h2 className="mt-4 font-display text-4xl tracking-tight md:text-5xl">
            Elige día, hora y tratamiento
          </h2>
          <p className="mt-4 text-muted-foreground">
            Los huecos en gris ya están ocupados. Tu solicitud se confirmará por teléfono.
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10">
          {/* Treatment selector */}
          <div>
            <label className="text-sm font-medium">Tratamiento</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {treatments.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTreatmentId(t.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    treatmentId === t.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  {t.name} · {t.price}€
                </button>
              ))}
            </div>
          </div>

          {/* Day picker */}
          <div className="mt-8">
            <label className="text-sm font-medium">Día</label>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
              {days.map((d) => {
                const active = isSameDay(d, selectedDay);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    className={`flex flex-col items-center rounded-2xl border px-2 py-3 text-center transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider opacity-80">
                      {format(d, "EEE", { locale: es })}
                    </span>
                    <span className="mt-1 font-display text-lg leading-none">{format(d, "d")}</span>
                    <span className="mt-0.5 text-[10px] opacity-80">{format(d, "MMM", { locale: es })}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots */}
          <div className="mt-8">
            <label className="text-sm font-medium">
              Horarios disponibles para {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
            </label>
            <div className="mt-3 min-h-[120px]">
              {loadingBusy ? (
                <div className="flex h-24 items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : dayClosed ? (
                <p className="text-sm text-muted-foreground">Tula no atiende este día.</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin huecos disponibles para este día.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                  {slots.map((s) => {
                    const active = selectedSlot && selectedSlot.getTime() === s.time.getTime();
                    return (
                      <button
                        key={s.time.toISOString()}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelectedSlot(s.time)}
                        className={`rounded-xl border px-3 py-2 text-sm transition ${
                          !s.available
                            ? "cursor-not-allowed border-border bg-muted text-muted-foreground/60 line-through"
                            : active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:border-primary"
                        }`}
                      >
                        {format(s.time, "HH:mm")}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 border-t border-border pt-8 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="name">Nombre</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
                className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="phone">Teléfono</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                required
                className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="+34 600 000 000"
              />
            </div>
            <div className="md:col-span-2 flex flex-col items-start justify-between gap-4 rounded-2xl bg-secondary/60 p-4 sm:flex-row sm:items-center">
              <div className="text-sm">
                <p className="font-medium">{treatment.name}</p>
                <p className="text-muted-foreground inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {treatment.duration} min · {treatment.price} €
                  {selectedSlot && (
                    <span className="ml-2">
                      · {format(selectedSlot, "EEEE d MMM, HH:mm", { locale: es })}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Solicitar cita
              </button>
            </div>
          </form>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Confirma tu cita</DialogTitle>
            <DialogDescription>
              Revisa los datos antes de enviar tu solicitud.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-3 rounded-2xl bg-secondary/60 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Tratamiento</span>
              <span className="font-medium text-right">{treatment.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Duración</span>
              <span className="font-medium">{treatment.duration} min</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Importe</span>
              <span className="font-medium">{treatment.price} €</span>
            </div>
            {selectedSlot && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Fecha y hora</span>
                <span className="font-medium text-right capitalize">
                  {format(selectedSlot, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium text-right">{name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Teléfono</span>
              <span className="font-medium">{phone}</span>
            </div>
          </div>

          <p className="mt-2 rounded-xl bg-primary/10 px-4 py-3 text-sm text-foreground">
            Tula confirmará lo antes posible tu cita vía WhatsApp. ¡Gracias!
          </p>

          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
              className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirmar cita
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
