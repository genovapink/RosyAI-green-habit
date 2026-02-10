import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Weight, MessageCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMarket } from "@/hooks/useMarket";
import { useChat } from "@/hooks/useChat";
import { toast } from "sonner";
import CreateListingDialog from "@/components/market/CreateListingDialog";
import MyListingsSheet from "@/components/market/MyListingsSheet";

const categories = ["Semua", "Plastik", "Kertas", "Kaca", "Logam", "Tekstil", "Minyak", "Elektronik", "Lainnya"];

const Market = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listings, loading, fetchListings } = useMarket();
  const { getOrCreateConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [chatLoading, setChatLoading] = useState<string | null>(null);

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleChatClick = async (listing: typeof listings[0]) => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk chat");
      navigate("/auth");
      return;
    }

    if (listing.user_id === user.id) {
      toast.info("Ini adalah listing Anda sendiri");
      return;
    }

    setChatLoading(listing.id);
    
    try {
      const conversationId = await getOrCreateConversation(
        listing.user_id,
        listing.name,
        listing.image_emoji || "♻️"
      );

      if (conversationId) {
        navigate(`/chat?id=${conversationId}`);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Gagal memulai chat");
    } finally {
      setChatLoading(null);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Market Sampah</h1>
            <p className="text-muted-foreground">Jual beli sampah bernilai ekonomis</p>
          </div>
          <div className="flex gap-2">
            {user && <MyListingsSheet />}
            <CreateListingDialog onSuccess={fetchListings} />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari sampah atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchListings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Loading State */}
        {loading && listings.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Memuat listing...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {listings.length === 0 
                ? "Belum ada listing. Jadilah yang pertama menjual sampah!" 
                : "Tidak ada item yang ditemukan"
              }
            </p>
            {listings.length === 0 && (
              <CreateListingDialog onSuccess={fetchListings} />
            )}
          </div>
        ) : (
          /* Items Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <Card 
                key={listing.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/market/${listing.id}`)}
              >
                <CardContent className="p-0">
                  <div className="h-32 bg-accent flex items-center justify-center overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img 
                        src={listing.images[0]} 
                        alt={listing.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl">{listing.image_emoji || "♻️"}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{listing.name}</h3>
                      <Badge variant="secondary">{listing.category}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Weight className="h-3 w-3" />
                        {listing.weight}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing.location}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Penjual: {listing.seller_name}
                      {listing.user_id === user?.id && (
                        <Badge variant="outline" className="ml-2 text-xs">Anda</Badge>
                      )}
                    </p>
                    {listing.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {listing.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">
                        Rp {listing.price.toLocaleString("id-ID")}
                      </p>
                      {listing.user_id !== user?.id && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChatClick(listing);
                          }}
                          disabled={chatLoading === listing.id}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {chatLoading === listing.id ? "..." : "Chat"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Market;
