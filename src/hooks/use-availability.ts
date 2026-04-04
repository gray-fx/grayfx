import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AvailabilityRecord {
  id: string;
  date: string;
  is_available: boolean;
  note: string | null;
}

export function useAvailability() {
  return useQuery({
    queryKey: ["availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return data as AvailabilityRecord[];
    },
  });
}

export function useToggleAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      is_available,
      note,
    }: {
      date: string;
      is_available: boolean;
      note?: string;
    }) => {
      // Try upsert by date
      const { data, error } = await supabase
        .from("availability")
        .upsert(
          { date, is_available, note: note || null },
          { onConflict: "date" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      const { error } = await supabase
        .from("availability")
        .delete()
        .eq("date", date);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
