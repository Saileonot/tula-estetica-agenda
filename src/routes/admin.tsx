import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, isSameDay, startOfDay, subDays, subYears } from "date-fns";
import { es } from "date-fns/locale/es";
import { toast } from "sonner";
import {
  Loader2, Check, X, LogOut, Phone, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, Inbox, MessageCircle, History,
} from "lucide-react";
import { OWNER } from "@/lib/owner";
import { buildWhatsappUrl, openWhatsapp } from "@/lib/whatsapp";

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
  price_eur: number;
  slot_at: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
};

type Tab = "day" | "requests";

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<Tab>("day");
  const [selectedDay, setSelectedDay] = useState<Date>(() => startOfDay(new Date()));
  const [historyFor, setHistoryFor] = useState<{ phone: string; name: string } | null>(null);

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

  async function updateStatus(a: Appointment, status: "confirmed" | "cancelled") {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", a.id);
    if (error) { toast.error("Error al actualizar"); return; }
    toast.success(status === "confirmed" ? "Cita confirmada" : "Cita cancelada");
    if (status === "confirmed") {
      // Abrir WhatsApp para enviar confirmación a la clienta
      const fechaTexto = format(new Date(a.slot_at), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
      const msg =
        `Hola ${a.client_name}, soy ${OWNER.name} 💕. ` +
        `Te confirmo tu cita de *${a.treatment}* el ${fechaTexto}. ` +
        `¡Te espero!`;
      const wa = `https://wa.me/${cleanPhone(a.client_phone)}?text=${encodeURIComponent(msg)}`;
      window.open(wa, "_blank", "noopener,noreferrer");
    }
    load();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  // Lista del día seleccionado: confirmadas + pendientes, ordenadas por hora
  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== "cancelled" && isSameDay(new Date(a.slot_at), selectedDay))
        .sort((a, b) => new Date(a.slot_at).getTime() - new Date(b.slot_at).getTime()),
    [appointments, selectedDay],
  );

  const pendingRequests = useMemo(
    () => appointments.filter((a) => a.status === "pending"),
    [appointments],
  );

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
        {/* Tabs */}
        <div className="mb-6 inline-flex rounded-full border border-border bg-background p-1">
          <TabBtn active={tab === "day"} onClick={() => setTab("day")} icon={<CalendarIcon className="h-4 w-4" />}>
            Agenda del día
          </TabBtn>
          <TabBtn active={tab === "requests"} onClick={() => setTab("requests")} icon={<Inbox className="h-4 w-4" />}>
            Solicitudes ({pendingRequests.length})
          </TabBtn>
        </div>

        {tab === "day" ? (
          <DayView
            selectedDay={selectedDay}
            onChangeDay={setSelectedDay}
            items={dayAppointments}
            onConfirm={(a) => updateStatus(a, "confirmed")}
            onCancel={(a) => updateStatus(a, "cancelled")}
            onOpenHistory={(a) => setHistoryFor({ phone: a.client_phone, name: a.client_name })}
          />
        ) : (
          <RequestsView
            items={pendingRequests}
            onConfirm={(a) => updateStatus(a, "confirmed")}
            onCancel={(a) => updateStatus(a, "cancelled")}
            onOpenHistory={(a) => setHistoryFor({ phone: a.client_phone, name: a.client_name })}
          />
        )}
      </main>

      {historyFor && (
        <ClientHistoryDialog
          phone={historyFor.phone}
          name={historyFor.name}
          onClose={() => setHistoryFor(null)}
        />
      )}
    </div>
  );
}

function TabBtn({
  active, onClick, children, icon,
}: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function DayView({
  selectedDay, onChangeDay, items, onConfirm, onCancel, onOpenHistory,
}: {
  selectedDay: Date;
  onChangeDay: (d: Date) => void;
  items: Appointment[];
  onConfirm: (a: Appointment) => void;
  onCancel: (a: Appointment) => void;
  onOpenHistory: (a: Appointment) => void;
}) {
  const totalDia = items
    .filter((a) => a.status === "confirmed")
    .reduce((sum, a) => sum + Number(a.price_eur ?? 0), 0);

  return (
    <>
      <div className="mb-6 flex flex-col items-stretch gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <button
            onClick={() => onChangeDay(subDays(selectedDay, 1))}
            className="rounded-full border border-border p-2 hover:bg-secondary"
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="px-3 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {isSameDay(selectedDay, new Date()) ? "Hoy" : format(selectedDay, "EEEE", { locale: es })}
            </p>
            <p className="font-display text-xl leading-tight">
              {format(selectedDay, "d 'de' MMMM", { locale: es })}
            </p>
          </div>
          <button
            onClick={() => onChangeDay(addDays(selectedDay, 1))}
            className="rounded-full border border-border p-2 hover:bg-secondary"
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => onChangeDay(startOfDay(new Date()))}
            className="rounded-full border border-border px-3 py-1.5 hover:bg-secondary"
          >
            Hoy
          </button>
          <span className="rounded-full bg-secondary/60 px-3 py-1.5 text-muted-foreground">
            {items.length} {items.length === 1 ? "cita" : "citas"} · {totalDia.toFixed(2)} €
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
          No hay citas para este día.
        </div>
      ) : (
        <ol className="grid gap-3">
          {items.map((a) => (
            <AppointmentCard
              key={a.id}
              a={a}
              showDate={false}
              onConfirm={() => onConfirm(a)}
              onCancel={() => onCancel(a)}
              onOpenHistory={() => onOpenHistory(a)}
            />
          ))}
        </ol>
      )}
    </>
  );
}

function RequestsView({
  items, onConfirm, onCancel, onOpenHistory,
}: {
  items: Appointment[];
  onConfirm: (a: Appointment) => void;
  onCancel: (a: Appointment) => void;
  onOpenHistory: (a: Appointment) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
        No hay solicitudes pendientes.
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      {items.map((a) => (
        <AppointmentCard
          key={a.id}
          a={a}
          showDate
          onConfirm={() => onConfirm(a)}
          onCancel={() => onCancel(a)}
          onOpenHistory={() => onOpenHistory(a)}
        />
      ))}
    </div>
  );
}

function AppointmentCard({
  a, showDate, onConfirm, onCancel, onOpenHistory,
}: {
  a: Appointment;
  showDate: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenHistory: () => void;
}) {
  const time = format(new Date(a.slot_at), "HH:mm");
  const dateText = format(new Date(a.slot_at), "EEEE d 'de' MMMM", { locale: es });
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div className="min-w-[64px] rounded-xl bg-primary/10 px-3 py-2 text-center">
            <p className="font-display text-xl leading-none text-primary">{time}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {a.duration_minutes} min
            </p>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-xl">{a.client_name}</p>
              <StatusPill status={a.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {a.treatment} · {Number(a.price_eur).toFixed(2)} €
              {showDate && <> · {dateText}</>}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
              <a href={`tel:${a.client_phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                <Phone className="h-3.5 w-3.5" /> {a.client_phone}
              </a>
              <a
                href={`https://wa.me/${cleanPhone(a.client_phone)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
              <button
                onClick={onOpenHistory}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <History className="h-3.5 w-3.5" /> Historial
              </button>
            </div>
          </div>
        </div>
        {a.status !== "cancelled" && (
          <div className="flex gap-2">
            {a.status === "pending" && (
              <button
                onClick={onConfirm}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-4 w-4" /> Confirmar
              </button>
            )}
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-secondary"
            >
              <X className="h-4 w-4" /> Cancelar
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: Appointment["status"] }) {
  const map = {
    confirmed: { label: "Confirmada", cls: "bg-primary/10 text-primary" },
    pending: { label: "Pendiente", cls: "bg-accent/30 text-accent-foreground" },
    cancelled: { label: "Cancelada", cls: "bg-muted text-muted-foreground" },
  } as const;
  const v = map[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${v.cls}`}>{v.label}</span>;
}

function ClientHistoryDialog({
  phone, name, onClose,
}: { phone: string; name: string; onClose: () => void }) {
  const [items, setItems] = useState<Appointment[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_phone", phone)
        .order("slot_at", { ascending: false });
      if (error) { toast.error("No se pudo cargar el historial"); setItems([]); return; }
      setItems((data as Appointment[]) ?? []);
    })();
  }, [phone]);

  const stats = useMemo(() => {
    if (!items) return null;
    const yearAgo = subYears(new Date(), 1);
    const lastYear = items.filter(
      (a) => a.status !== "cancelled" && new Date(a.slot_at) >= yearAgo,
    );
    const total = items
      .filter((a) => a.status !== "cancelled")
      .reduce((s, a) => s + Number(a.price_eur ?? 0), 0);
    const totalLastYear = lastYear.reduce((s, a) => s + Number(a.price_eur ?? 0), 0);
    return { totalAll: total, totalLastYear, countLastYear: lastYear.length, count: items.length };
  }, [items]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ficha de clienta</p>
            <h2 className="mt-1 font-display text-2xl">{name}</h2>
            <a
              href={`https://wa.me/${cleanPhone(phone)}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" /> {phone}
            </a>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-secondary" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!items ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            {stats && (
              <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3">
                <Stat label="Citas (12 m.)" value={`${stats.countLastYear}`} />
                <Stat label="Gasto 12 m." value={`${stats.totalLastYear.toFixed(2)} €`} highlight />
                <Stat label="Gasto total" value={`${stats.totalAll.toFixed(2)} €`} />
              </div>
            )}
            <div className="border-t border-border">
              {items.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">Sin historial todavía.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-6 py-3 text-sm">
                      <div>
                        <p className="font-medium">{a.treatment}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(a.slot_at), "d MMM yyyy · HH:mm", { locale: es })}
                          {" · "}{a.duration_minutes} min
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusPill status={a.status} />
                        <span className={`tabular-nums ${a.status === "cancelled" ? "text-muted-foreground line-through" : ""}`}>
                          {Number(a.price_eur).toFixed(2)} €
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-xl ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

/**
 * Normaliza el teléfono para wa.me:
 *  - quita espacios, guiones y paréntesis
 *  - si empieza por "+" lo elimina
 *  - si parece un número español de 9 dígitos sin prefijo, antepone 34
 */
function cleanPhone(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (/^\d{9}$/.test(p)) p = "34" + p;
  return p;
}
