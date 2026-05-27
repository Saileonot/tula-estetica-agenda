import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { toast } from "sonner";
import { Loader2, Check, X, LogOut, Phone } from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Panel · Tula estética" }] }),
  component: AdminPage,
});

type Appointment = {
  id: string;
  client_name: string;
  client_phone: string;
  treatment: string;
  duration_minutes: number;
  slot_at: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<"pending" | "confirmed" | "all">("pending");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("slot_at", { ascending: true });
    if (error) {
      toast.error("No se pudieron cargar las citas");
      return;
    }
    setAppointments((data as Appointment[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sessionData.session.user.id);
      const admin = (roles ?? []).some((r) => r.role === "admin");
      setIsAdmin(admin);
      if (admin) await load();
      setLoading(false);
    })();
  }, [navigate, load]);

  async function updateStatus(id: string, status: "confirmed" | "cancelled") {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) { toast.error("Error al actualizar"); return; }
    toast.success(status === "confirmed" ? "Cita confirmada" : "Cita cancelada");
    load();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl">Sin acceso</h1>
          <p className="mt-2 text-muted-foreground">Esta cuenta no tiene permisos de administradora.</p>
          <button onClick={signOut} className="mt-6 rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const filtered = appointments.filter((a) => filter === "all" || a.status === filter);
  const counts = {
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    all: appointments.length,
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <Link to="/" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Tula estética</Link>
            <h1 className="font-display text-2xl">Panel de citas</h1>
          </div>
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          {(["pending", "confirmed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"
              }`}
            >
              {f === "pending" ? "Pendientes" : f === "confirmed" ? "Confirmadas" : "Todas"} ({counts[f]})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
            No hay citas en esta vista.
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((a) => (
              <article key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-display text-xl">{a.client_name}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        a.status === "confirmed" ? "bg-primary/10 text-primary" :
                        a.status === "cancelled" ? "bg-muted text-muted-foreground" :
                        "bg-accent/30 text-accent-foreground"
                      }`}>
                        {a.status === "pending" ? "Pendiente" : a.status === "confirmed" ? "Confirmada" : "Cancelada"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {a.treatment} · {a.duration_minutes} min
                    </p>
                    <p className="mt-1 text-sm">
                      {format(new Date(a.slot_at), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                    <a href={`tel:${a.client_phone}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                      <Phone className="h-3.5 w-3.5" /> {a.client_phone}
                    </a>
                  </div>
                  {a.status !== "cancelled" && (
                    <div className="flex gap-2">
                      {a.status === "pending" && (
                        <button
                          onClick={() => updateStatus(a.id, "confirmed")}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                        >
                          <Check className="h-4 w-4" /> Confirmar
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(a.id, "cancelled")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-secondary"
                      >
                        <X className="h-4 w-4" /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
