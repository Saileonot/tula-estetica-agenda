import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "create_appointment",
  title: "Create appointment",
  description: "Book a confirmed appointment at Tula Estética. Provide the treatment id (from list_treatments), the ISO datetime of the slot, and the client's name and mobile phone.",
  inputSchema: {
    treatment_id: z.string().describe("Treatment id (slug) from list_treatments"),
    slot_at: z.string().describe("ISO 8601 datetime of the appointment start"),
    client_name: z.string().min(1),
    client_phone: z.string().min(6).describe("Mobile phone number of the client"),
    notes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ treatment_id, slot_at, client_name, client_phone, notes }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: treatment, error: tErr } = await supabase
      .from("treatments")
      .select("id,name,duration_minutes,price_eur,is_active")
      .eq("id", treatment_id)
      .maybeSingle();
    if (tErr || !treatment || !treatment.is_active) {
      return { content: [{ type: "text", text: `Treatment not found or inactive: ${treatment_id}` }], isError: true };
    }
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        treatment: treatment.name,
        slot_at,
        duration_minutes: treatment.duration_minutes,
        price_eur: treatment.price_eur,
        client_name,
        client_phone,
        notes: notes ?? null,
        status: "confirmed",
      })
      .select()
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Appointment confirmed for ${client_name} on ${slot_at}` }],
      structuredContent: { appointment: data },
    };
  },
});
