import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.js";

export interface Origin {
  iata_code: string;
  city: string;
  country: string;
}

export const useOrigins = () => {
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("origins")
      .select("*")
      .order("city")
      .then(({ data }) => {
        if (data) setOrigins(data);
        setLoading(false);
      });
  }, []);

  return { origins, loading };
};
