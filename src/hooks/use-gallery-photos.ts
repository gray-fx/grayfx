import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string;
  category: string;
  display_location: string;
  sort_order: number;
  created_at: string;
}

export function useGalleryPhotos(location?: "collage" | "gallery") {
  return useQuery({
    queryKey: ["gallery-photos", location],
    queryFn: async () => {
      let query = supabase
        .from("gallery_photos")
        .select("*")
        .order("sort_order", { ascending: true });
      if (location) query = query.eq("display_location", location);
      const { data, error } = await query;
      if (error) throw error;
      return data as GalleryPhoto[];
    },
  });
}

export function useDeleteGalleryPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery-photos"] }),
  });
}

export function useUpdateGalleryPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GalleryPhoto> & { id: string }) => {
      const { error } = await supabase.from("gallery_photos").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery-photos"] }),
  });
}

export function useAddGalleryPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: Omit<GalleryPhoto, "id" | "created_at">) => {
      const { error } = await supabase.from("gallery_photos").insert(photo);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery-photos"] }),
  });
}

export async function uploadGalleryImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("gallery-photos").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("gallery-photos").getPublicUrl(path);
  return data.publicUrl;
}
