import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useGalleryPhotos,
  useAddGalleryPhoto,
  useDeleteGalleryPhoto,
  useUpdateGalleryPhoto,
  uploadGalleryImage,
} from "@/hooks/use-gallery-photos";
import { Loader2, Trash2, Upload, Pencil, Check, X } from "lucide-react";

const AdminPhotosTab = () => {
  const { toast } = useToast();
  const { data: photos, isLoading } = useGalleryPhotos();
  const addPhoto = useAddGalleryPhoto();
  const deletePhoto = useDeleteGalleryPhoto();
  const updatePhoto = useUpdateGalleryPhoto();

  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<"gallery" | "collage">("gallery");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast({ title: "Select an image first", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const url = await uploadGalleryImage(file);
      await addPhoto.mutateAsync({
        image_url: url,
        caption,
        category,
        display_location: location,
        sort_order: (photos?.length ?? 0),
      });
      setCaption("");
      setCategory("");
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: "Photo added!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePhoto.mutateAsync(id);
      toast({ title: "Photo removed" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const startEdit = (photo: { id: string; caption: string; category: string }) => {
    setEditingId(photo.id);
    setEditCaption(photo.caption);
    setEditCategory(photo.category);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updatePhoto.mutateAsync({ id: editingId, caption: editCaption, category: editCategory });
      setEditingId(null);
      toast({ title: "Caption updated" });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const collagePhotos = photos?.filter((p) => p.display_location === "collage") ?? [];
  const galleryPhotos = photos?.filter((p) => p.display_location === "gallery") ?? [];

  return (
    <div className="space-y-8">
      {/* Upload form */}
      <div className="space-y-4 p-4 border border-border rounded-lg">
        <h3 className="font-display text-lg font-semibold text-foreground">Add Photo</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Display Location</Label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as "gallery" | "collage")}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="gallery">Gallery (with caption)</option>
              <option value="collage">Background Collage</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Image</Label>
            <input ref={fileRef} type="file" accept="image/*" className="text-sm text-foreground" />
          </div>
        </div>
        {location === "gallery" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Caption</Label>
              <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. @ Howard" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Football" />
            </div>
          </div>
        )}
        <Button onClick={handleUpload} disabled={uploading} size="sm">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Upload
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading photos…</p>}

      {/* Gallery photos */}
      {galleryPhotos.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-foreground">Gallery Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryPhotos.map((p) => (
              <div key={p.id} className="relative group rounded-md overflow-hidden border border-border">
                <img src={p.image_url} alt={p.caption} className="w-full aspect-[4/3] object-cover" />
                <div className="p-2 space-y-1">
                  {editingId === p.id ? (
                    <div className="space-y-1">
                      <Input
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        placeholder="Caption"
                        className="h-7 text-xs"
                      />
                      <Input
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        placeholder="Category"
                        className="h-7 text-xs"
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={saveEdit}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setEditingId(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-foreground truncate">{p.caption || "No caption"}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.category || "No category"}</p>
                    </>
                  )}
                </div>
                {editingId !== p.id && (
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={() => startEdit(p)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collage photos */}
      {collagePhotos.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-foreground">Background Collage Photos</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {collagePhotos.map((p) => (
              <div key={p.id} className="relative group rounded-md overflow-hidden border border-border">
                <img src={p.image_url} alt="" className="w-full aspect-square object-cover" />
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPhotosTab;
