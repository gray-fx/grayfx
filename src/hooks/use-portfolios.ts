import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Portfolio {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioPhoto {
  id: string;
  portfolio_id: string;
  image_url: string;
  caption: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `portfolio-${Date.now().toString(36)}`
  );
}

export function usePortfolios() {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Portfolio[];
    },
  });
}

export function usePrimaryPortfolio() {
  return useQuery({
    queryKey: ["portfolio-primary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("is_primary", true)
        .maybeSingle();
      if (error) throw error;
      return (data as Portfolio) ?? null;
    },
  });
}

export function usePortfolioBySlug(slug?: string) {
  return useQuery({
    queryKey: ["portfolio", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return (data as Portfolio) ?? null;
    },
  });
}

export function usePortfolioPhotos(portfolioId?: string) {
  return useQuery({
    queryKey: ["portfolio-photos", portfolioId],
    enabled: !!portfolioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_photos")
        .select("*")
        .eq("portfolio_id", portfolioId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as PortfolioPhoto[];
    },
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; is_primary?: boolean }) => {
      const { data, error } = await supabase
        .from("portfolios")
        .insert({
          name: input.name,
          slug: slugify(input.name),
          description: input.description ?? "",
          is_primary: input.is_primary ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Portfolio;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      qc.invalidateQueries({ queryKey: ["portfolio-primary"] });
    },
  });
}

export function useUpdatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Portfolio> & { id: string }) => {
      const { error } = await supabase.from("portfolios").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      qc.invalidateQueries({ queryKey: ["portfolio-primary"] });
    },
  });
}

export function useDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      qc.invalidateQueries({ queryKey: ["portfolio-primary"] });
    },
  });
}

export function useAddPortfolioPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photos: { portfolio_id: string; image_url: string; caption: string; sort_order: number }[]) => {
      const { error } = await supabase.from("portfolio_photos").insert(photos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio-photos"] }),
  });
}

export function useUpdatePortfolioPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PortfolioPhoto> & { id: string }) => {
      const { error } = await supabase.from("portfolio_photos").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio-photos"] }),
  });
}

export function useDeletePortfolioPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolio_photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio-photos"] }),
  });
}

export async function uploadPortfolioImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `portfolios/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("gallery-photos").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("gallery-photos").getPublicUrl(path);
  return data.publicUrl;
}
