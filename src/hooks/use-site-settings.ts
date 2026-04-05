import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  is_active: boolean;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");
      if (error) throw error;
      return data as SiteSetting[];
    },
  });
}

export function useSiteSetting(key: string) {
  return useQuery({
    queryKey: ["site-settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return data as SiteSetting | null;
    },
  });
}

export function useUpdateSiteSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      key,
      value,
      is_active,
    }: {
      key: string;
      value: Record<string, any>;
      is_active: boolean;
    }) => {
      const { data, error } = await supabase
        .from("site_settings")
        .update({ value: value as any, is_active, updated_at: new Date().toISOString() })
        .eq("key", key)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
}
