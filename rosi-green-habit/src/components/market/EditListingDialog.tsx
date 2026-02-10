import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";
import { useMarket, MarketListing, CreateListingData } from "@/hooks/useMarket";
import { toast } from "sonner";
import ImageUploader from "./ImageUploader";

const categories = ["Plastik", "Kertas", "Kaca", "Logam", "Tekstil", "Minyak", "Elektronik", "Lainnya"];

const emojiOptions = ["🥤", "📦", "🍾", "🔩", "👕", "🫗", "📱", "♻️", "🗑️", "💡"];

interface EditListingDialogProps {
  listing: MarketListing;
}

const EditListingDialog = ({ listing }: EditListingDialogProps) => {
  const { updateListing } = useMarket();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateListingData>({
    name: listing.name,
    category: listing.category,
    weight: listing.weight,
    price: listing.price,
    location: listing.location,
    description: listing.description || "",
    image_emoji: listing.image_emoji || "♻️",
    images: listing.images || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.weight || !formData.price || !formData.location) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setLoading(true);
    const success = await updateListing(listing.id, formData);
    setLoading(false);

    if (success) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 gap-1">
          <Edit className="h-3 w-3" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nama Sampah *</Label>
            <Input
              id="edit-name"
              placeholder="Contoh: Botol Plastik Bekas"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Kategori *</Label>
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
              <Label htmlFor="edit-weight">Berat/Jumlah *</Label>
              <Input
                id="edit-weight"
                placeholder="Contoh: 5 kg"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Harga (Rp) *</Label>
              <Input
                id="edit-price"
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
            <Label htmlFor="edit-location">Lokasi *</Label>
            <Input
              id="edit-location"
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
            <Label htmlFor="edit-description">Deskripsi (Opsional)</Label>
            <Textarea
              id="edit-description"
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
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditListingDialog;
