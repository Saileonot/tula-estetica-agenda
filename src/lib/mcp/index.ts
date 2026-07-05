import { defineMcp } from "@lovable.dev/mcp-js";
import listTreatments from "./tools/list-treatments";
import listAppointmentsOnDate from "./tools/list-availability";
import createAppointment from "./tools/create-appointment";

export default defineMcp({
  name: "tula-estetica-mcp",
  title: "Tula Estética MCP",
  version: "0.1.0",
  instructions:
    "Tools for Tula Estética beauty salon. Use list_treatments to see services, list_appointments_on_date to check availability on a given day, and create_appointment to book a confirmed slot for a client.",
  tools: [listTreatments, listAppointmentsOnDate, createAppointment],
});
