import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Weight, MessageCircle, User, Calendar, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { toast } from "sonner";
import type { MarketListing } from "@/hooks/useMarket";
import ImageGallery from "@/components/market/ImageGallery";

interface ListingWithSeller extends MarketListing {
  seller_name: string;
}

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrCreateConversation } = useChat();

  const [listing, setListing] = useState<ListingWithSeller | null>(null);
  const [relatedListings, setRelatedListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("market_listings")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        // Get seller name
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", data.user_id)
          .maybeSingle();

        setListing({
          ...data,
          seller_name: profile?.display_name || "Penjual"
        });

        // Fetch related listings (same category, exclude current)
        const { data: related } = await supabase
          .from("market_listings")
          .select("*")
          .eq("category", data.category)
          .eq("status", "active")
          .neq("id", id)
          .limit(4);

        if (related) {
          const relatedWithSellers = await Promise.all(
            related.map(async (item) => {
              const { data: p } = await supabase
                .from("profiles")
                .select("display_name")
                .eq("user_id", item.user_id)
                .maybeSingle();
              return { ...item, seller_name: p?.display_name || "Penjual" };
            })
          );
          setRelatedListings(relatedWithSellers);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        toast.error("Listing tidak ditemukan");
        navigate("/market");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, navigate]);

  const handleChatClick = async () => {
    if (!listing) return;

    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk chat");
      navigate("/auth");
      return;
    }

    if (listing.user_id === user.id) {
      toast.info("Ini adalah listing Anda sendiri");
      return;
    }

    setChatLoading(true);
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
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[50vh]">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground">Listing tidak ditemukan</p>
          <Button variant="outline" onClick={() => navigate("/market")} className="mt-4">
            Kembali ke Market
          </Button>
        </div>
      </Layout>
    );
  }

  const formattedDate = new Date(listing.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate("/market")} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <ImageGallery 
                images={listing.images || []} 
                emoji={listing.image_emoji} 
              />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{listing.name}</h1>
                    <Badge variant="secondary" className="mt-2">{listing.category}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    Rp {listing.price.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Weight className="h-4 w-4" />
                    {listing.weight}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {listing.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formattedDate}
                  </span>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Deskripsi</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {listing.description || "Tidak ada deskripsi"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Penjual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-accent">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{listing.seller_name}</p>
                    <p className="text-sm text-muted-foreground">Penjual aktif</p>
                  </div>
                </div>

                {listing.user_id !== user?.id ? (
                  <Button
                    onClick={handleChatClick}
                    disabled={chatLoading}
                    className="w-full gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {chatLoading ? "Memuat..." : "Chat dengan Penjual"}
                  </Button>
                ) : (
                  <Badge variant="outline" className="w-full justify-center py-2">
                    Ini listing Anda
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Related Listings */}
            {relatedListings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Listing Terkait</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedListings.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/market/${item.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors text-left"
                    >
                      {item.images && item.images.length > 0 ? (
                        <img 
                          src={item.images[0]} 
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-2xl w-12 h-12 flex items-center justify-center">
                          {item.image_emoji || "♻️"}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-sm text-primary font-semibold">
                          Rp {item.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ListingDetail;
