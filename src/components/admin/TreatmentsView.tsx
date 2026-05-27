import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Plus, ImageIcon, Upload } from "lucide-react";

type Row = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_eur: number;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
};

const BUCKET = "treatment-images";
const MAX_BYTES = 5 * 1024 * 1024;

async function uploadImage(slug: string, file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    toast.error("El archivo debe ser una imagen");
    return null;
  }
  if (file.size > MAX_BYTES) {
    toast.error("La imagen no puede superar 5 MB");
    return null;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${slug}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    toast.error("No se pudo subir la imagen");
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

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

  async function handleImageChange(id: string, file: File) {
    const url = await uploadImage(id, file);
    if (!url) return;
    const { error } = await supabase.from("treatments").update({ image_url: url }).eq("id", id);
    if (error) { toast.error("No se pudo guardar la imagen"); return; }
    patch(id, { image_url: url });
    toast.success("Imagen actualizada");
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

  async function add(input: { id: string; name: string; description: string; duration: number; price: number; file: File | null }) {
    const slug = input.id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    if (!slug) { toast.error("Identificador no válido"); return false; }
    let image_url: string | null = null;
    if (input.file) {
      image_url = await uploadImage(slug, input.file);
      if (!image_url) return false;
    }
    const sort = (items ?? []).reduce((m, r) => Math.max(m, r.sort_order), 0) + 1;
    const { error } = await supabase.from("treatments").insert({
      id: slug,
      name: input.name,
      description: input.description,
      duration_minutes: input.duration,
      price_eur: input.price,
      sort_order: sort,
      image_url,
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
              Edita nombre, duración, precio e imagen. Desmarca «Activo» para ocultar de la web.
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

        <ul className="mt-5 divide-y divide-border">
          {items.map((r) => (
            <li key={r.id} className="grid gap-4 py-4 sm:grid-cols-[120px_1fr]">
              <ImageCell url={r.image_url} onPick={(f) => handleImageChange(r.id, f)} />
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_100px_100px_80px_auto_auto]">
                  <input
                    value={r.name}
                    onChange={(e) => patch(r.id, { name: e.target.value })}
                    className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="Nombre"
                  />
                  <input
                    type="number" min={5} step={5}
                    value={r.duration_minutes}
                    onChange={(e) => patch(r.id, { duration_minutes: Number(e.target.value) })}
                    className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="min"
                  />
                  <input
                    type="number" min={0} step={1}
                    value={r.price_eur}
                    onChange={(e) => patch(r.id, { price_eur: Number(e.target.value) })}
                    className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="€"
                  />
                  <input
                    type="number"
                    value={r.sort_order}
                    onChange={(e) => patch(r.id, { sort_order: Number(e.target.value) })}
                    className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="orden"
                  />
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={r.is_active}
                      onChange={(e) => patch(r.id, { is_active: e.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                    Activo
                  </label>
                  <button
                    onClick={() => remove(r.id)}
                    className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  value={r.description}
                  onChange={(e) => patch(r.id, { description: e.target.value })}
                  rows={2}
                  placeholder="Descripción"
                  className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-muted-foreground"
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <NewTreatmentForm onSubmit={add} />
    </div>
  );
}

function ImageCell({ url, onPick }: { url: string | null; onPick: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-border bg-secondary/40"
      >
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
            <span>Sin imagen</span>
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-foreground/60 text-xs font-medium text-background opacity-0 transition group-hover:opacity-100">
          <Upload className="h-3.5 w-3.5" />
          Cambiar
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function NewTreatmentForm({
  onSubmit,
}: {
  onSubmit: (input: { id: string; name: string; description: string; duration: number; price: number; file: File | null }) => Promise<boolean>;
}) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(25);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const preview = file ? URL.createObjectURL(file) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !id.trim()) return;
    setBusy(true);
    const ok = await onSubmit({ id, name: name.trim(), description: description.trim(), duration, price, file });
    setBusy(false);
    if (ok) {
      setId(""); setName(""); setDescription(""); setDuration(45); setPrice(25); setFile(null);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-6">
      <h3 className="font-display text-lg">Añadir tratamiento</h3>
      <p className="text-xs text-muted-foreground">
        El identificador es un slug interno (p. ej. <code>masaje-piedras</code>). La foto se mostrará en la web.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
        <label className="block">
          <div className="relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-secondary/40 text-xs text-muted-foreground">
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <ImageIcon className="h-5 w-5" />
                <span>Subir foto</span>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={id} onChange={(e) => setId(e.target.value)}
              placeholder="identificador"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción"
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="number" min={5} step={5} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="duración (min)"
            />
            <input
              type="number" min={0} step={1} value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="precio (€)"
            />
          </div>
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
