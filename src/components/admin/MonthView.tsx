import { useMemo } from "react";
import {
  addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  startOfMonth, startOfWeek, subMonths,
} from "date-fns";
import { es } from "date-fns/locale/es";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type MonthAppointment = {
  id: string;
  client_name: string;
  treatment: string;
  slot_at: string;
  status: "pending" | "confirmed" | "cancelled";
  price_eur: number;
};

type Props = {
  month: Date;
  onChangeMonth: (d: Date) => void;
  items: MonthAppointment[];
  onPickDay: (d: Date) => void;
};

export function MonthView({ month, onChangeMonth, items, onPickDay }: Props) {
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const days: Date[] = [];
    let d = start;
    while (d <= end) { days.push(d); d = addDays(d, 1); }
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, MonthAppointment[]>();
    items.forEach((a) => {
      if (a.status === "cancelled") return;
      const key = format(new Date(a.slot_at), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    });
    map.forEach((arr) =>
      arr.sort((a, b) => new Date(a.slot_at).getTime() - new Date(b.slot_at).getTime()),
    );
    return map;
  }, [items]);

  const today = new Date();
  const weekdayLabels = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3">
        <button
          onClick={() => onChangeMonth(subMonths(month, 1))}
          className="rounded-full border border-border p-2 hover:bg-secondary"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-display text-xl capitalize">
          {format(month, "MMMM yyyy", { locale: es })}
        </p>
        <button
          onClick={() => onChangeMonth(addMonths(month, 1))}
          className="rounded-full border border-border p-2 hover:bg-secondary"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/40 text-center text-xs uppercase tracking-wider text-muted-foreground">
          {weekdayLabels.map((l) => (
            <div key={l} className="py-2">{l}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {weeks.flat().map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const dayItems = byDay.get(key) ?? [];
            const inMonth = isSameMonth(d, month);
            const isToday = isSameDay(d, today);
            return (
              <button
                key={key}
                onClick={() => onPickDay(d)}
                className={`flex min-h-[92px] flex-col gap-1 border-b border-r border-border p-2 text-left transition hover:bg-secondary/40 ${
                  inMonth ? "" : "bg-secondary/20 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday ? "bg-primary text-primary-foreground font-medium" : ""
                    }`}
                  >
                    {format(d, "d")}
                  </span>
                  {dayItems.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {dayItems.length}
                    </span>
                  )}
                </div>
                <ul className="space-y-0.5 overflow-hidden">
                  {dayItems.slice(0, 3).map((a) => (
                    <li
                      key={a.id}
                      className={`truncate rounded px-1 py-0.5 text-[11px] ${
                        a.status === "confirmed"
                          ? "bg-primary/15 text-primary"
                          : "bg-accent/30 text-accent-foreground"
                      }`}
                      title={`${a.client_name} · ${a.treatment}`}
                    >
                      {format(new Date(a.slot_at), "HH:mm")} {a.client_name}
                    </li>
                  ))}
                  {dayItems.length > 3 && (
                    <li className="text-[10px] text-muted-foreground">
                      +{dayItems.length - 3} más
                    </li>
                  )}
                </ul>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
