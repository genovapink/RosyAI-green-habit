import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Scan, Recycle, Coins, History, Receipt, Settings, LogOut, ChevronRight, Leaf, RefreshCw } from "lucide-react";
import rosiMascot from "@/assets/rosi-mascot.png";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useStats";

const menuItems = [
  { label: "Riwayat Scan", icon: History, path: "/history-scan" },
  { label: "Riwayat Transaksi", icon: Receipt, path: "/history-transaction" },
  { label: "Pengaturan", icon: Settings, path: "/settings" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { stats, scanHistory, loading } = useUserStats(user?.id);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getLevelName = (level: number) => {
    const levels = ["Pemula", "Pejuang Hijau", "Pahlawan Hijau", "Guardian Bumi", "Legenda Hijau"];
    return levels[Math.min(level - 1, levels.length - 1)] || "Pemula";
  };

  const getNextLevelPoints = (level: number) => {
    const thresholds = [50, 200, 500, 1000, 2000];
    return thresholds[Math.min(level - 1, thresholds.length - 1)] || 50;
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

  const userStats = [
    { label: "Total Scan", value: stats?.totalScans?.toString() || "0", icon: Scan, color: "text-primary" },
    { label: "Sampah Terselamatkan", value: `${stats?.totalWasteSaved?.toFixed(1) || "0"} kg`, icon: Recycle, color: "text-chart-2" },
    { label: "Poin ROSi", value: stats?.totalPoints?.toLocaleString("id-ID") || "0", icon: Coins, color: "text-chart-4" },
  ];

  const currentLevel = stats?.level || 1;
  const nextLevelPoints = getNextLevelPoints(currentLevel);
  const progressPercent = Math.min(((stats?.totalPoints || 0) / nextLevelPoints) * 100, 100);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4 ring-4 ring-primary/20">
                <AvatarImage src={rosiMascot} alt="User Avatar" />
                <AvatarFallback className="text-4xl bg-accent">👤</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-foreground">{stats?.displayName || "Pengguna ROSi"}</h2>
              <p className="text-muted-foreground text-sm mb-3">{stats?.email || "user@example.com"}</p>
              <Badge className="gap-1">
                <Leaf className="h-3 w-3" />
                {getLevelName(currentLevel)} Lv. {currentLevel}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Statistik Kamu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {userStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-accent flex items-center justify-center">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 bg-primary text-primary-foreground">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Level Berikutnya: {getLevelName(currentLevel + 1)} Lv. {currentLevel + 1}</h3>
                <p className="text-sm text-primary-foreground/80 mb-3">
                  {Math.max(0, nextLevelPoints - (stats?.totalPoints || 0))} poin lagi untuk naik level!
                </p>
                <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-foreground rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
              <div className="text-4xl">🌱</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <div key={item.label}>
                <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                {index < menuItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Button variant="outline" onClick={handleLogout} className="w-full mt-6 gap-2 text-destructive hover:text-destructive">
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">Kamu sudah membantu menyelamatkan</p>
          <p className="text-2xl font-bold text-primary">{stats?.totalWasteSaved?.toFixed(1) || "0"} kg sampah</p>
          <p className="text-sm text-muted-foreground">dari TPA! 🎉</p>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
