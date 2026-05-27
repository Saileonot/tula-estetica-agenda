import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Plus } from "lucide-react";

type Row = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_eur: number;
  sort_order: number;
  is_active: boolean;
};

export function TreatmentsView() {
  const [items, setItems] = useState<Row[] | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("treatments")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) { toast.error("No se pudieron cargar los tratamientos"); return; }
    setItems(
      (data ?? []).map((r) => ({ ...r, price_eur: Number(r.price_eur) })) as Row[],
    );
  }, []);

  useEffect(() => { load(); }, [load]);

  function patch(id: string, p: Partial<Row>) {
    setItems((xs) => xs?.map((x) => (x.id === id ? { ...x, ...p } : x)) ?? null);
  }

  async function saveAll() {
    if (!items) return;
    setSaving(true);
    const results = await Promise.all(
      items.map((r) =>
        supabase.from("treatments").update({
          name: r.name,
          description: r.description,
          duration_minutes: r.duration_minutes,
          price_eur: r.price_eur,
          sort_order: r.sort_order,
          is_active: r.is_active,
        }).eq("id", r.id),
      ),
    );
    setSaving(false);
    const err = results.find((r) => r.error);
    if (err?.error) { toast.error("No se pudieron guardar los cambios"); return; }
    toast.success("Tratamientos actualizados");
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este tratamiento?")) return;
    const { error } = await supabase.from("treatments").delete().eq("id", id);
    if (error) { toast.error("No se pudo eliminar"); return; }
    toast.success("Tratamiento eliminado");
    load();
  }

  async function add(input: { id: string; name: string; duration: number; price: number }) {
    const slug = input.id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    if (!slug) { toast.error("Identificador no válido"); return false; }
    const sort = (items ?? []).reduce((m, r) => Math.max(m, r.sort_order), 0) + 1;
    const { error } = await supabase.from("treatments").insert({
      id: slug,
      name: input.name,
      duration_minutes: input.duration,
      price_eur: input.price,
      sort_order: sort,
    });
    if (error) {
      toast.error(error.code === "23505" ? "Ese identificador ya existe" : "No se pudo crear");
      return false;
    }
    toast.success("Tratamiento añadido");
    load();
    return true;
  }

  if (!items) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl">Tratamientos</h2>
            <p className="text-sm text-muted-foreground">
              Edita nombre, duración y precio. Desmarca «Activo» para ocultar de la web.
            </p>
          </div>
          <button
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar todo
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Duración (min)</th>
                <th className="py-2 pr-3">Precio (€)</th>
                <th className="py-2 pr-3">Orden</th>
                <th className="py-2 pr-3">Activo</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="py-3 pr-3">
                    <input
                      value={r.name}
                      onChange={(e) => patch(r.id, { name: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-2 py-1.5"
                    />
                    <textarea
                      value={r.description}
                      onChange={(e) => patch(r.id, { description: e.target.value })}
                      rows={2}
                      placeholder="Descripción"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-muted-foreground"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="number" min={5} step={5}
                      value={r.duration_minutes}
                      onChange={(e) => patch(r.id, { duration_minutes: Number(e.target.value) })}
                      className="w-24 rounded-lg border border-input bg-background px-2 py-1.5"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="number" min={0} step={1}
                      value={r.price_eur}
                      onChange={(e) => patch(r.id, { price_eur: Number(e.target.value) })}
                      className="w-24 rounded-lg border border-input bg-background px-2 py-1.5"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="number"
                      value={r.sort_order}
                      onChange={(e) => patch(r.id, { sort_order: Number(e.target.value) })}
                      className="w-20 rounded-lg border border-input bg-background px-2 py-1.5"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="checkbox"
                      checked={r.is_active}
                      onChange={(e) => patch(r.id, { is_active: e.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => remove(r.id)}
                      className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <NewTreatmentForm onSubmit={add} />
    </div>
  );
}

function NewTreatmentForm({
  onSubmit,
}: {
  onSubmit: (input: { id: string; name: string; duration: number; price: number }) => Promise<boolean>;
}) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(25);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !id.trim()) { return; }
    setBusy(true);
    const ok = await onSubmit({ id, name: name.trim(), duration, price });
    setBusy(false);
    if (ok) { setId(""); setName(""); setDuration(45); setPrice(25); }
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-6">
      <h3 className="font-display text-lg">Añadir tratamiento</h3>
      <p className="text-xs text-muted-foreground">
        El identificador es un slug interno (p. ej. <code>masaje-piedras</code>).
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <input
          value={id} onChange={(e) => setId(e.target.value)}
          placeholder="identificador"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm sm:col-span-2"
        />
        <div className="flex gap-2">
          <input
            type="number" min={5} step={5} value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm"
            placeholder="min"
          />
          <input
            type="number" min={0} step={1} value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm"
            placeholder="€"
          />
        </div>
      </div>
      <button
        type="submit" disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Añadir
      </button>
    </form>
  );
}
