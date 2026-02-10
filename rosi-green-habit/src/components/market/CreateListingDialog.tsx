import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useMarket, CreateListingData } from "@/hooks/useMarket";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ImageUploader from "./ImageUploader";

const categories = ["Plastik", "Kertas", "Kaca", "Logam", "Tekstil", "Minyak", "Elektronik", "Lainnya"];

const emojiOptions = ["🥤", "📦", "🍾", "🔩", "👕", "🫗", "📱", "♻️", "🗑️", "💡"];

export interface CreateListingDialogProps {
  onSuccess?: () => void;
  prefillData?: {
    name?: string;
    category?: string;
    description?: string;
    image_emoji?: string;
    estimatedPrice?: number;
    scanImageUrl?: string;
  };
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const CreateListingDialog = ({ 
  onSuccess, 
  prefillData, 
  externalOpen, 
  onOpenChange,
  hideTrigger 
}: CreateListingDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createListing } = useMarket();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  const [formData, setFormData] = useState<CreateListingData>({
    name: "",
    category: "",
    weight: "",
    price: 0,
    location: "",
    description: "",
    image_emoji: "♻️",
    images: []
  });

  // Helper to upload base64 image to storage
  const uploadBase64Image = async (base64: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      // Convert base64 to blob
      const response = await fetch(base64);
      const blob = await response.blob();
      
      const fileName = `${user.id}/${Date.now()}-scan.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from("market-images")
        .upload(fileName, blob);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("market-images")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Base64 upload error:", error);
      return null;
    }
  };

  // Prefill form data when dialog opens with prefillData
  useEffect(() => {
    const initPrefill = async () => {
      if (open && prefillData) {
        let images: string[] = [];
        
        // If scanImageUrl is base64, upload it first
        if (prefillData.scanImageUrl?.startsWith('data:')) {
          const uploadedUrl = await uploadBase64Image(prefillData.scanImageUrl);
          if (uploadedUrl) {
            images = [uploadedUrl];
          }
        } else if (prefillData.scanImageUrl) {
          images = [prefillData.scanImageUrl];
        }

        setFormData(prev => ({
          ...prev,
          name: prefillData.name || prev.name,
          category: prefillData.category || prev.category,
          description: prefillData.description || prev.description,
          image_emoji: prefillData.image_emoji || prev.image_emoji,
          price: prefillData.estimatedPrice || prev.price,
          images: images.length > 0 ? images : prev.images
        }));
      }
    };
    
    initPrefill();
  }, [open, prefillData, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.weight || !formData.price || !formData.location) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setLoading(true);
    const success = await createListing(formData);
    setLoading(false);

    if (success) {
      setOpen(false);
      setFormData({
        name: "",
        category: "",
        weight: "",
        price: 0,
        location: "",
        description: "",
        image_emoji: "♻️",
        images: []
      });
      onSuccess?.();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !user) {
      toast.error("Silakan login terlebih dahulu untuk menjual sampah");
      navigate("/auth");
      return;
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="gap-2 w-full md:w-auto">
            <Plus className="h-4 w-4" />
            Jual Sampah
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Jual Sampah Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Sampah *</Label>
            <Input
              id="name"
              placeholder="Contoh: Botol Plastik Bekas"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Berat/Jumlah *</Label>
              <Input
                id="weight"
                placeholder="Contoh: 5 kg"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Harga (Rp) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                placeholder="15000"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Lokasi *</Label>
            <Input
              id="location"
              placeholder="Contoh: Jakarta Selatan"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Foto Sampah (1-3 gambar)</Label>
            <ImageUploader
              images={formData.images || []}
              onImagesChange={(images) => setFormData({ ...formData, images })}
              maxImages={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Emoji (jika tidak ada foto)</Label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, image_emoji: emoji })}
                  className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                    formData.image_emoji === emoji
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Textarea
              id="description"
              placeholder="Tambahkan detail tentang kondisi sampah..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Menyimpan..." : "Jual Sekarang"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateListingDialog;
