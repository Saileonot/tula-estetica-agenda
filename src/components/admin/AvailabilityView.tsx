import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Plus, CalendarOff } from "lucide-react";

type WorkingHour = {
  id: string;
  day_of_week: number;
  open_time: string; // "HH:mm:ss"
  close_time: string;
  is_closed: boolean;
};

type TimeBlock = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function toHHMM(t: string) {
  return t.slice(0, 5);
}

export function AvailabilityView() {
  const [hours, setHours] = useState<WorkingHour[] | null>(null);
  const [blocks, setBlocks] = useState<TimeBlock[] | null>(null);
  const [savingHours, setSavingHours] = useState(false);

  const load = useCallback(async () => {
    const [{ data: wh }, { data: tb }] = await Promise.all([
      supabase.from("working_hours").select("*").order("day_of_week"),
      supabase
        .from("time_blocks")
        .select("*")
        .gte("ends_at", new Date().toISOString())
        .order("starts_at"),
    ]);
    setHours((wh as WorkingHour[]) ?? []);
    setBlocks((tb as TimeBlock[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  function patchHour(id: string, patch: Partial<WorkingHour>) {
    setHours((h) => h?.map((x) => (x.id === id ? { ...x, ...patch } : x)) ?? null);
  }

  async function saveHours() {
    if (!hours) return;
    setSavingHours(true);
    const updates = hours.map((h) =>
      supabase
        .from("working_hours")
        .update({
          open_time: toHHMM(h.open_time),
          close_time: toHHMM(h.close_time),
          is_closed: h.is_closed,
        })
        .eq("id", h.id),
    );
    const results = await Promise.all(updates);
    const err = results.find((r) => r.error);
    setSavingHours(false);
    if (err?.error) {
      toast.error("No se pudo guardar el horario");
      return;
    }
    toast.success("Horario guardado");
    load();
  }

  async function addBlock(input: { starts_at: string; ends_at: string; reason: string }) {
    if (new Date(input.ends_at) <= new Date(input.starts_at)) {
      toast.error("La hora de fin debe ser posterior al inicio");
      return false;
    }
    const { error } = await supabase.from("time_blocks").insert({
      starts_at: new Date(input.starts_at).toISOString(),
      ends_at: new Date(input.ends_at).toISOString(),
      reason: input.reason || null,
    });
    if (error) {
      toast.error("No se pudo crear el bloqueo");
      return false;
    }
    toast.success("Bloqueo añadido");
    load();
    return true;
  }

  async function deleteBlock(id: string) {
    const { error } = await supabase.from("time_blocks").delete().eq("id", id);
    if (error) { toast.error("No se pudo eliminar"); return; }
    toast.success("Bloqueo eliminado");
    load();
  }

  if (!hours || !blocks) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Horario semanal */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl">Horario semanal</h2>
            <p className="text-sm text-muted-foreground">Horas en las que aceptas citas habitualmente.</p>
          </div>
          <button
            onClick={saveHours}
            disabled={savingHours}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {savingHours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </button>
        </div>

        <ul className="mt-5 divide-y divide-border">
          {hours.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="w-24 text-sm font-medium">{DAY_LABELS[h.day_of_week]}</span>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!h.is_closed}
                  onChange={(e) => patchHour(h.id, { is_closed: !e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <span className={h.is_closed ? "text-muted-foreground" : ""}>Abierto</span>
              </label>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="time"
                  value={toHHMM(h.open_time)}
                  disabled={h.is_closed}
                  onChange={(e) => patchHour(h.id, { open_time: e.target.value })}
                  className="rounded-lg border border-input bg-background px-2 py-1 text-sm disabled:opacity-50"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="time"
                  value={toHHMM(h.close_time)}
                  disabled={h.is_closed}
                  onChange={(e) => patchHour(h.id, { close_time: e.target.value })}
                  className="rounded-lg border border-input bg-background px-2 py-1 text-sm disabled:opacity-50"
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Bloqueos */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <div>
          <h2 className="font-display text-xl">Ausencias y bloqueos</h2>
          <p className="text-sm text-muted-foreground">
            Vacaciones, viajes, comidas o cualquier rato en el que no quieras citas.
          </p>
        </div>

        <NewBlockForm onSubmit={addBlock} />

        <ul className="mt-6 divide-y divide-border">
          {blocks.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted-foreground">
              Sin bloqueos próximos.
            </li>
          ) : (
            blocks.map((b) => {
              const start = new Date(b.starts_at);
              const end = new Date(b.ends_at);
              const sameDay = start.toDateString() === end.toDateString();
              return (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-start gap-3">
                    <CalendarOff className="mt-1 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {format(start, "EEE d MMM, HH:mm", { locale: es })}
                        {" – "}
                        {sameDay
                          ? format(end, "HH:mm")
                          : format(end, "EEE d MMM, HH:mm", { locale: es })}
                      </p>
                      {b.reason && (
                        <p className="text-xs text-muted-foreground">{b.reason}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteBlock(b.id)}
                    className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Eliminar bloqueo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}

function NewBlockForm({
  onSubmit,
}: {
  onSubmit: (input: { starts_at: string; ends_at: string; reason: string }) => Promise<boolean>;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState("10:00");
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState("14:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await onSubmit({
      starts_at: `${startDate}T${startTime}`,
      ends_at: `${endDate}T${endTime}`,
      reason: reason.trim(),
    });
    setBusy(false);
    if (ok) { setReason(""); }
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-3 rounded-2xl bg-secondary/40 p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-muted-foreground">Desde</span>
          <div className="mt-1 flex gap-2">
            <input
              type="date" required value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
            />
            <input
              type="time" required value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">Hasta</span>
          <div className="mt-1 flex gap-2">
            <input
              type="date" required value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
            />
            <input
              type="time" required value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
        </label>
      </div>
      <input
        type="text" value={reason} maxLength={120}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (opcional): vacaciones, viaje, comida…"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <button
        type="submit" disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Añadir bloqueo
      </button>
    </form>
  );
}
