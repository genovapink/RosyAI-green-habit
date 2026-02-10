import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Mail, Lock, User, ArrowRight } from "lucide-react";
import rosiMascot from "@/assets/rosi-mascot.png";
import { z } from "zod";

const emailSchema = z.string().email("Email tidak valid");
const passwordSchema = z.string().min(6, "Password minimal 6 karakter");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Login Gagal",
              description: "Email atau password salah. Silakan coba lagi.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Login Gagal",
              description: error.message,
            });
          }
        } else {
          toast({
            title: "Selamat Datang! 🌱",
            description: "Login berhasil. Ayo selamatkan bumi!",
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Registrasi Gagal",
              description: "Email sudah terdaftar. Silakan login.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Registrasi Gagal",
              description: error.message,
            });
          }
        } else {
          toast({
            title: "Registrasi Berhasil! 🎉",
            description: "Akun berhasil dibuat. Selamat bergabung!",
          });
          navigate("/");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Leaf className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center p-4">
      {/* Logo & Mascot */}
      <div className="text-center mb-6">
        <img 
          src={rosiMascot} 
          alt="ROSi Mascot" 
          className="w-24 h-24 mx-auto mb-4 animate-bounce-slow"
        />
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">ROSi</h1>
        </div>
        <p className="text-muted-foreground">Reduce • Reuse • Recycle</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isLogin ? "Masuk ke ROSi" : "Daftar ROSi"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Masuk untuk melanjutkan misi hijau kamu!" 
              : "Bergabung bersama pahlawan hijau lainnya!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Nama Tampilan</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Pahlawan Hijau"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <Leaf className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Masuk" : "Daftar"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
              <Button
                variant="link"
                className="text-primary font-semibold px-1"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
              >
                {isLogin ? "Daftar sekarang" : "Masuk"}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-6 text-sm text-muted-foreground text-center">
        Dibuat dengan 💚 oleh Tim 4 Anak Masa Depan
      </p>
    </div>
  );
};

export default Auth;
