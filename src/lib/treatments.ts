import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

// Imágenes por id (slug) para tratamientos legacy sin imagen subida.
const IMAGES: Record<string, string> = {
  manicura,
  pedicura,
  facial,
  maderoterapia,
  reductor,
  depilacion,
};

const FALLBACK_IMAGE = facial;

type Row = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_eur: number | string;
  is_active: boolean;
  sort_order: number;
  image_url: string | null;
};

function rowToTreatment(r: Row): Treatment {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    duration: r.duration_minutes,
    price: Number(r.price_eur),
    image: r.image_url ?? IMAGES[r.id] ?? FALLBACK_IMAGE,
    image_url: r.image_url,
    is_active: r.is_active,
    sort_order: r.sort_order,
  };
}


export async function fetchTreatments(opts?: { onlyActive?: boolean }): Promise<Treatment[]> {
  let q = supabase.from("treatments").select("*").order("sort_order", { ascending: true });
  if (opts?.onlyActive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) {
    console.error("fetchTreatments", error);
    return [];
  }
  return (data as Row[]).map(rowToTreatment);
}

export function useTreatments(opts?: { onlyActive?: boolean }) {
  const [treatments, setTreatments] = useState<Treatment[] | null>(null);
  const onlyActive = opts?.onlyActive ?? false;

  useEffect(() => {
    let cancelled = false;
    fetchTreatments({ onlyActive }).then((t) => {
      if (!cancelled) setTreatments(t);
    });
    return () => { cancelled = true; };
  }, [onlyActive]);

  return treatments;
}
