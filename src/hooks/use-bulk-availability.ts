import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBulkToggleAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dates,
      is_available,
      note,
    }: {
      dates: string[];
      is_available: boolean;
      note?: string;
    }) => {
      const rows = dates.map((date) => ({
        date,
        is_available,
        note: note || null,
      }));
      const { error } = await supabase
        .from("availability")
        .upsert(rows, { onConflict: "date" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useBulkDeleteAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dates: string[]) => {
      const { error } = await supabase
        .from("availability")
        .delete()
        .in("date", dates);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
