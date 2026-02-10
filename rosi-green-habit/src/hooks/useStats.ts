import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GlobalStats {
  totalScans: number;
  valuableRecycled: number;
  activeUsers: number;
  listingsSold: number;
}

export interface UserStats {
  totalScans: number;
  totalPoints: number;
  totalWasteSaved: number;
  level: number;
  displayName: string;
  email: string;
}

export const useGlobalStats = () => {
  const [stats, setStats] = useState<GlobalStats>({
    totalScans: 0,
    valuableRecycled: 0,
    activeUsers: 0,
    listingsSold: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Total scans
      const { count: totalScans } = await supabase
        .from("scan_history")
        .select("*", { count: "exact", head: true });

      // Valuable recycled (is_valuable = true)
      const { count: valuableRecycled } = await supabase
        .from("scan_history")
        .select("*", { count: "exact", head: true })
        .eq("is_valuable", true);

      // Active users (unique users who scanned in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: activeUsersData } = await supabase
        .from("scan_history")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      const uniqueActiveUsers = new Set(activeUsersData?.map(d => d.user_id) || []).size;

      // Listings sold
      const { count: listingsSold } = await supabase
        .from("market_listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "sold");

      setStats({
        totalScans: totalScans || 0,
        valuableRecycled: (valuableRecycled || 0) + (listingsSold || 0),
        activeUsers: uniqueActiveUsers,
        listingsSold: listingsSold || 0
      });
    } catch (error) {
      console.error("Error fetching global stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
};

export const useUserStats = (userId: string | undefined) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Fetch auth user for email
      const { data: authData } = await supabase.auth.getUser();

      // Fetch scan history
      const { data: history } = await supabase
        .from("scan_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      setStats({
        totalScans: profile?.total_scans || 0,
        totalPoints: profile?.total_points || 0,
        totalWasteSaved: profile?.total_waste_saved || 0,
        level: profile?.level || 1,
        displayName: profile?.display_name || "Pengguna ROSi",
        email: authData?.user?.email || "user@example.com"
      });

      setScanHistory(history || []);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  return { stats, scanHistory, loading, refetch: fetchUserStats };
};
