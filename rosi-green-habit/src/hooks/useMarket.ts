import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface MarketListing {
  id: string;
  user_id: string;
  name: string;
  category: string;
  weight: string;
  price: number;
  location: string;
  description: string | null;
  image_emoji: string | null;
  images: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
  seller_name?: string;
}

export interface CreateListingData {
  name: string;
  category: string;
  weight: string;
  price: number;
  location: string;
  description?: string;
  image_emoji?: string;
  images?: string[];
}

export const useMarket = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [myListings, setMyListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all active listings
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("market_listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get seller names from profiles
      const listingsWithSellers = await Promise.all(
        (data || []).map(async (listing) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", listing.user_id)
            .maybeSingle();

          return {
            ...listing,
            seller_name: profile?.display_name || "Penjual"
          };
        })
      );

      setListings(listingsWithSellers);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      toast.error("Gagal memuat listing");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's own listings
  const fetchMyListings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("market_listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyListings(data || []);
    } catch (error: any) {
      console.error("Error fetching my listings:", error);
    }
  }, [user]);

  // Create a new listing
  const createListing = useCallback(async (data: CreateListingData): Promise<boolean> => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      return false;
    }

    try {
      const { error } = await supabase
        .from("market_listings")
        .insert({
          user_id: user.id,
          name: data.name,
          category: data.category,
          weight: data.weight,
          price: data.price,
          location: data.location,
          description: data.description,
          image_emoji: data.image_emoji || "♻️",
          images: data.images || []
        });

      if (error) throw error;

      toast.success("Listing berhasil dibuat!");
      fetchListings();
      fetchMyListings();
      return true;
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error("Gagal membuat listing");
      return false;
    }
  }, [user, fetchListings, fetchMyListings]);

  // Update a listing
  const updateListing = useCallback(async (
    listingId: string, 
    data: Partial<CreateListingData>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("market_listings")
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Listing berhasil diupdate!");
      fetchListings();
      fetchMyListings();
      return true;
    } catch (error: any) {
      console.error("Error updating listing:", error);
      toast.error("Gagal mengupdate listing");
      return false;
    }
  }, [user, fetchListings, fetchMyListings]);

  // Delete a listing
  const deleteListing = useCallback(async (listingId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("market_listings")
        .delete()
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Listing berhasil dihapus!");
      fetchListings();
      fetchMyListings();
      return true;
    } catch (error: any) {
      console.error("Error deleting listing:", error);
      toast.error("Gagal menghapus listing");
      return false;
    }
  }, [user, fetchListings, fetchMyListings]);

  // Mark as sold
  const markAsSold = useCallback(async (listingId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("market_listings")
        .update({ status: "sold", updated_at: new Date().toISOString() })
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Listing ditandai sebagai terjual!");
      fetchListings();
      fetchMyListings();
      return true;
    } catch (error: any) {
      console.error("Error marking as sold:", error);
      toast.error("Gagal mengupdate status");
      return false;
    }
  }, [user, fetchListings, fetchMyListings]);

  // Initial fetch
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  return {
    listings,
    myListings,
    loading,
    fetchListings,
    fetchMyListings,
    createListing,
    updateListing,
    deleteListing,
    markAsSold
  };
};
