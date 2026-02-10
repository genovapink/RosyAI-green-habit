import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scan, ShoppingBag, Recycle, Leaf, Users, Sparkles, LogIn } from "lucide-react";
import rosiMascot from "@/assets/rosi-mascot.png";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalStats } from "@/hooks/useStats";

const wasteCategories = [
  { name: "Plastik", icon: "🥤", color: "bg-accent" },
  { name: "Kaca", icon: "🍾", color: "bg-accent" },
  { name: "Kertas", icon: "📄", color: "bg-accent" },
  { name: "Logam", icon: "🔩", color: "bg-accent" },
  { name: "Organik", icon: "🍂", color: "bg-accent" },
  { name: "Elektronik", icon: "📱", color: "bg-accent" },
];

const teamMembers = [
  { name: "Genova", emoji: "🌟" },
  { name: "Eliska", emoji: "🌸" },
  { name: "Abraham", emoji: "🌿" },
  { name: "Rayna", emoji: "🌈" },
];

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useGlobalStats();

  const statsDisplay = [
    { label: "Sampah di-scan", value: statsLoading ? "..." : stats.totalScans.toLocaleString("id-ID"), icon: Scan },
    { label: "Berhasil didaur ulang", value: statsLoading ? "..." : stats.valuableRecycled.toLocaleString("id-ID"), icon: Recycle },
    { label: "Pengguna aktif", value: statsLoading ? "..." : stats.activeUsers.toLocaleString("id-ID"), icon: Users },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent via-background to-accent py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4">
                Scan Sampahmu,{" "}
                <span className="text-primary">Selamatkan Bumi</span> &
                Dapatkan Poin ROSi
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Bantu lingkungan dengan memilah sampah yang benar. Dapatkan
                edukasi dan poin setiap kali scan!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button asChild size="lg" className="gap-2 shadow-lg">
                  <Link to="/scan">
                    <Scan className="h-5 w-5" />
                    Scan Sekarang
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to="/market">
                    <ShoppingBag className="h-5 w-5" />
                    Lihat Market
                  </Link>
                </Button>
                {!authLoading && !user && (
                  <Button asChild variant="secondary" size="lg" className="gap-2">
                    <Link to="/auth">
                      <LogIn className="h-5 w-5" />
                      Masuk / Daftar
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <img
                  src={rosiMascot}
                  alt="ROSi Mascot"
                  className="relative w-48 h-48 md:w-64 md:h-64 drop-shadow-2xl animate-bounce-slow"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statsDisplay.map((stat) => (
              <Card key={stat.label} className="border-primary/20 hover:shadow-lg transition-shadow">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 rounded-full bg-accent">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Waste Categories */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Kategori Sampah
            </h2>
            <p className="text-muted-foreground">
              Kenali jenis sampahmu untuk pemilahan yang tepat
            </p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {wasteCategories.map((category) => (
              <Link
                key={category.name}
                to="/scan"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all"
              >
                <span className="text-3xl">{category.icon}</span>
                <span className="text-sm font-medium text-foreground">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="py-12 bg-accent">
        <div className="container mx-auto px-4">
          <Card className="border-primary/20 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <Leaf className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Tahukah Kamu?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Dengan memilah sampah dengan benar, kamu bisa mengurangi
                    volume sampah di TPA hingga 60%! Sampah yang bernilai
                    ekonomis bisa dijual kembali melalui Market ROSi.
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Setiap scan = Satu langkah untuk bumi yang lebih baik
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Tim Pembuat ROSi
            </h2>
            <p className="text-muted-foreground">4 Anak Masa Depan 🌟</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border"
              >
                <span className="text-4xl">{member.emoji}</span>
                <span className="font-medium text-foreground">{member.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Siap Jadi Pahlawan Lingkungan?
          </h2>
          <p className="text-primary-foreground/80 mb-6">
            Mulai scan sampahmu sekarang dan jadilah bagian dari perubahan!
          </p>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link to="/scan">
              <Scan className="h-5 w-5" />
              Mulai Scan
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
