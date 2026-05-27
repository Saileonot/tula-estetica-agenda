import manicura from "@/assets/manicura.jpg";
import facial from "@/assets/facial.jpg";
import maderoterapia from "@/assets/maderoterapia.jpg";
import reductor from "@/assets/reductor.jpg";
import depilacion from "@/assets/depilacion.jpg";
import pedicura from "@/assets/pedicura.jpg";

export type Treatment = {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;   // EUR
  image: string;
};

export const TREATMENTS: Treatment[] = [
  {
    id: "manicura",
    name: "Manicura",
    description: "Cuidado profesional de uñas con esmaltado de larga duración.",
    duration: 45,
    price: 22,
    image: manicura,
  },
  {
    id: "pedicura",
    name: "Pedicura",
    description: "Tratamiento completo de pies, limado, hidratación y esmaltado.",
    duration: 60,
    price: 30,
    image: pedicura,
  },
  {
    id: "facial",
    name: "Tratamiento Facial",
    description: "Limpieza profunda, exfoliación y mascarilla revitalizante.",
    duration: 60,
    price: 45,
    image: facial,
  },
  {
    id: "maderoterapia",
    name: "Masaje con Maderoterapia",
    description: "Masaje moldeante con instrumentos de madera para activar la circulación.",
    duration: 75,
    price: 55,
    image: maderoterapia,
  },
  {
    id: "reductor",
    name: "Tratamiento Reductor",
    description: "Sesión intensiva para reducir contornos y tonificar la piel.",
    duration: 60,
    price: 50,
    image: reductor,
  },
  {
    id: "depilacion",
    name: "Depilación",
    description: "Depilación con cera tibia, suave y precisa.",
    duration: 30,
    price: 18,
    image: depilacion,
  },
];

export const getTreatment = (id: string) => TREATMENTS.find((t) => t.id === id);
