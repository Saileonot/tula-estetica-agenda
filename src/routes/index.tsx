import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Treatments } from "@/components/Treatments";
import { BookingSection } from "@/components/BookingSection";
import { FarmasiSection } from "@/components/FarmasiSection";
import { AboutSection } from "@/components/AboutSection";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tula estética — Reserva tu cita de belleza" },
      { name: "description", content: "Manicura, pedicura, faciales, maderoterapia, tratamientos reductores y depilación. Reserva online con Tula estética." },
      { property: "og:title", content: "Tula estética" },
      { property: "og:description", content: "Tratamientos de estética y bienestar. Reserva online tu cita." },
    ],
  }),
  component: Index,
});

function Index() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  function handleSelect(id: string) {
    setSelected(id);
    requestAnimationFrame(() => {
      document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Treatments onSelect={handleSelect} />
        <AboutSection />
        <BookingSection initialTreatmentId={selected} />
        <FarmasiSection />
      </main>
      <Footer />
    </div>
  );
}
