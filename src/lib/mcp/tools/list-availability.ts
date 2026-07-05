import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_appointments_on_date",
  title: "List appointments on date",
  description: "List booked appointments on a given date (YYYY-MM-DD) to see which time slots are already taken.",
  inputSchema: {
    date: z.string().describe("Date in ISO YYYY-MM-DD format, e.g. 2026-07-10"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ date }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const start = new Date(`${date}T00:00:00`).toISOString();
    const end = new Date(`${date}T23:59:59`).toISOString();
    const { data, error } = await supabase
      .from("appointments")
      .select("slot_at,duration_minutes,treatment,status")
      .gte("slot_at", start)
      .lte("slot_at", end)
      .order("slot_at", { ascending: true });
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { appointments: data },
    };
  },
});
