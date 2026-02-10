import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, ArrowLeft, CheckCircle, XCircle, Recycle, ShoppingBag, Leaf, Sparkles, Share2, Twitter, Instagram, CameraOff, RefreshCw, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import CreateListingDialog from "@/components/market/CreateListingDialog";

const wasteCategories = [
  { id: "plastik", name: "Sampah Plastik", icon: "🥤", description: "Wadah, kemasan plastik" },
  { id: "botol-plastik", name: "Botol Plastik Minuman", icon: "🧴", description: "Botol PET, HDPE" },
  { id: "botol-kaca", name: "Botol Kaca", icon: "🍾", description: "Botol minuman, toples" },
  { id: "kayu", name: "Kayu", icon: "🪵", description: "Kayu bekas, palet" },
  { id: "furniture", name: "Furniture Bekas", icon: "🪑", description: "Meja, kursi, lemari" },
  { id: "minyak-jelantah", name: "Minyak Jelantah", icon: "🫗", description: "Minyak goreng bekas" },
  { id: "oli", name: "Oli Bekas", icon: "🛢️", description: "Oli kendaraan" },
  { id: "pakaian", name: "Pakaian Bekas", icon: "👕", description: "Baju, celana layak" },
  { id: "elektronik", name: "Elektronik Rusak", icon: "📱", description: "HP, laptop, TV" },
  { id: "besi", name: "Besi / Scrap", icon: "🔩", description: "Logam bekas" },
  { id: "sampah-harian", name: "Sampah Harian", icon: "🗑️", description: "Sampah rumah tangga" },
  { id: "sampah-makanan", name: "Sampah Makanan", icon: "🍂", description: "Sisa makanan" },
  { id: "kemasan-plastik", name: "Kemasan Plastik", icon: "📦", description: "Bungkus snack, sachet" },
  { id: "kertas", name: "Kertas", icon: "📄", description: "Kardus, koran, majalah" },
];

// Map category IDs to market categories
const categoryToMarketCategory: Record<string, string> = {
  "plastik": "Plastik",
  "botol-plastik": "Plastik",
  "kemasan-plastik": "Plastik",
  "botol-kaca": "Kaca",
  "kayu": "Lainnya",
  "furniture": "Lainnya",
  "minyak-jelantah": "Minyak",
  "oli": "Minyak",
  "pakaian": "Tekstil",
  "elektronik": "Elektronik",
  "besi": "Logam",
  "sampah-harian": "Lainnya",
  "sampah-makanan": "Lainnya",
  "kertas": "Kertas"
};

interface ScanResult {
  name: string;
  detectedCategory?: string;
  isValuable: boolean;
  estimatedPrice?: string | null;
  description: string;
  recommendations: string[];
  tips: string[];
  environmentalImpact?: string;
}

const Scan = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"category" | "capture" | "result">("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showListingDialog, setShowListingDialog] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Tidak dapat mengakses kamera. Pastikan kamera diizinkan.");
      setIsCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
    }
  }, []);

  useEffect(() => {
    if (step === "capture" && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step, capturedImage, startCamera, stopCamera]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep("capture");
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage || !selectedCategory) return;
    
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-waste', {
        body: {
          imageBase64: capturedImage,
          category: selectedCategory
        }
      });
      
      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Save to scan history if user is logged in
      if (user) {
        const priceString = data.estimatedPrice;
        let estimatedPrice = null;
        if (priceString) {
          const match = priceString.match(/[\d.,]+/);
          if (match) {
            estimatedPrice = parseFloat(match[0].replace(/\./g, '').replace(',', '.'));
          }
        }
        
        const pointsEarned = data.isValuable ? 10 : 5;
        
        await supabase.from('scan_history').insert({
          user_id: user.id,
          waste_name: data.name,
          waste_category: selectedCategory,
          is_valuable: data.isValuable,
          estimated_price: estimatedPrice,
          recommendation: data.recommendations?.join(', ') || '',
          environmental_impact: data.environmentalImpact || '',
          points_earned: pointsEarned
        });
        
        toast({
          title: `+${pointsEarned} Poin ROSi! 🌱`,
          description: "Hasil scan tersimpan ke riwayat kamu.",
        });
      }
      
      setResult(data);
      setStep("result");
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menganalisa gambar",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleReset = () => {
    setStep("category");
    setSelectedCategory(null);
    setResult(null);
    setCapturedImage(null);
    stopCamera();
  };

  // Generate share caption
  const generateShareCaption = () => {
    if (!result) return "";
    return `🌱 Saya scan ${result.name} dengan ROSi!

${result.isValuable ? "✅ Bernilai Ekonomis" : "♻️ Perlu Dikelola"}
${result.estimatedPrice ? `💰 Estimasi: ${result.estimatedPrice}` : ""}

${result.description.slice(0, 100)}...

💡 Yuk pilah sampahmu! 🌍

Ide: @4anakmasadepan
#ROSi #PilahSampah #LingkunganHidup`;
  };

  const shareToTwitter = () => {
    if (!result) return;
    const tweetText = generateShareCaption();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareToInstagram = () => {
    toast({
      title: "Bagikan ke Instagram",
      description: "Download gambar dulu, lalu upload manual ke Instagram Stories/Feed.",
    });
    downloadShareImage();
  };

  const downloadShareImage = async () => {
    if (!capturedImage || !result) return;
    
    // Create a canvas with the share content
    const shareCanvas = document.createElement('canvas');
    shareCanvas.width = 1080;
    shareCanvas.height = 1920;
    const ctx = shareCanvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(1, '#059669');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Load and draw captured image
    const img = new Image();
    img.onload = () => {
      // Draw image in circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, 500, 250, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const scale = Math.max(500 / img.width, 500 / img.height);
      const imgX = 540 - (img.width * scale) / 2;
      const imgY = 500 - (img.height * scale) / 2;
      ctx.drawImage(img, imgX, imgY, img.width * scale, img.height * scale);
      ctx.restore();

      // Circle border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(540, 500, 254, 0, Math.PI * 2);
      ctx.stroke();

      // Text content
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      
      // Title
      ctx.font = 'bold 64px system-ui';
      ctx.fillText(result.name, 540, 850);
      
      // Status
      ctx.font = '48px system-ui';
      ctx.fillText(result.isValuable ? '✅ Bernilai Ekonomis' : '♻️ Perlu Dikelola', 540, 940);
      
      // Price
      if (result.estimatedPrice) {
        ctx.font = 'bold 56px system-ui';
        ctx.fillText(`💰 ${result.estimatedPrice}`, 540, 1030);
      }

      // Description (wrapped)
      ctx.font = '36px system-ui';
      const words = result.description.split(' ');
      let line = '';
      let textY = 1150;
      for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > 900) {
          ctx.fillText(line, 540, textY);
          line = word + ' ';
          textY += 50;
          if (textY > 1400) break;
        } else {
          line = testLine;
        }
      }
      if (textY <= 1400) ctx.fillText(line, 540, textY);

      // Footer
      ctx.font = 'bold 40px system-ui';
      ctx.fillText('🌱 ROSi - Scan Sampahmu!', 540, 1650);
      
      ctx.font = '32px system-ui';
      ctx.fillText('Ide: @4anakmasadepan', 540, 1720);
      ctx.fillText('#ROSi #PilahSampah #LingkunganHidup', 540, 1780);

      // Download
      const link = document.createElement('a');
      link.download = `rosi-scan-${Date.now()}.png`;
      link.href = shareCanvas.toDataURL('image/png');
      link.click();

      toast({
        title: "Gambar tersimpan!",
        description: "Upload ke Twitter/Instagram dengan caption yang sudah disiapkan.",
      });
    };
    img.src = capturedImage;
  };

  const copyCaption = () => {
    const caption = generateShareCaption();
    navigator.clipboard.writeText(caption);
    toast({
      title: "Caption disalin!",
      description: "Paste caption ke postingan sosial media kamu.",
    });
  };

  const listToMarket = () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menjual sampah di Market.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    setShowListingDialog(true);
  };

  // Get prefill data for listing dialog
  const getListingPrefillData = () => {
    if (!result || !selectedCategory) return undefined;
    
    const priceMatch = result.estimatedPrice?.match(/[\d.,]+/);
    const estimatedPrice = priceMatch 
      ? parseInt(priceMatch[0].replace(/\./g, '').replace(',', '')) 
      : 0;

    return {
      name: result.name,
      category: categoryToMarketCategory[selectedCategory] || "Lainnya",
      description: result.description,
      image_emoji: wasteCategories.find(c => c.id === selectedCategory)?.icon || "♻️",
      estimatedPrice,
      scanImageUrl: capturedImage || undefined
    };
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Step 1: Category Selection */}
        {step === "category" && (
          <div className="animate-in fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Scan Sampah
              </h1>
              <p className="text-muted-foreground">
                Pilih kategori sampah yang ingin kamu scan
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {wasteCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all text-left"
                >
                  <span className="text-4xl">{category.icon}</span>
                  <span className="font-medium text-foreground text-sm text-center">
                    {category.name}
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    {category.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Capture */}
        {step === "capture" && (
          <div className="animate-in fade-in max-w-lg mx-auto">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {wasteCategories.find(c => c.id === selectedCategory)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="aspect-square bg-accent rounded-xl overflow-hidden border-2 border-dashed border-border relative">
                  {isAnalyzing ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                      <div className="text-center">
                        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-muted-foreground">Menganalisa dengan AI...</p>
                      </div>
                    </div>
                  ) : null}
                  
                  {capturedImage ? (
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-full object-cover"
                    />
                  ) : cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <CameraOff className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center text-sm mb-4">
                        {cameraError}
                      </p>
                      <Button variant="outline" onClick={startCamera} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Coba Lagi
                      </Button>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {capturedImage ? (
                    <>
                      <Button
                        onClick={analyzeImage}
                        disabled={isAnalyzing}
                        className="w-full gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Analisa dengan AI
                      </Button>
                      <Button
                        variant="outline"
                        onClick={retakePhoto}
                        disabled={isAnalyzing}
                        className="w-full gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Ambil Ulang
                      </Button>
                    </>
                  ) : (
                    <div className="flex gap-4">
                      <Button
                        onClick={capturePhoto}
                        disabled={!isCameraActive}
                        className="flex-1 gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Ambil Foto
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Result */}
        {step === "result" && result && (
          <div className="animate-in fade-in max-w-lg mx-auto">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Scan Lagi
            </Button>

            <Card className="overflow-hidden">
              <div className={cn(
                "py-6 text-center",
                result.isValuable ? "bg-primary" : "bg-muted"
              )}>
                {capturedImage && (
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-background">
                    <img src={capturedImage} alt="Scanned" className="w-full h-full object-cover" />
                  </div>
                )}
                <h2 className={cn(
                  "text-xl font-bold",
                  result.isValuable ? "text-primary-foreground" : "text-foreground"
                )}>
                  {result.name}
                </h2>
                <div className={cn(
                  "flex items-center justify-center gap-2 mt-2",
                  result.isValuable ? "text-primary-foreground" : "text-foreground"
                )}>
                  {result.isValuable ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Bernilai Ekonomis</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Tidak Bernilai Ekonomis</span>
                    </>
                  )}
                </div>
                {result.estimatedPrice && (
                  <p className={cn(
                    "text-sm mt-1",
                    result.isValuable ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    Estimasi: {result.estimatedPrice}
                  </p>
                )}
              </div>

              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground">{result.description}</p>

                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Recycle className="h-4 w-4 text-primary" />
                    Rekomendasi Pengolahan
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-accent rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" />
                    Tips Ramah Lingkungan
                  </h3>
                  <ul className="space-y-1">
                    {result.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {result.environmentalImpact && (
                  <div className="bg-primary/10 rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      🌍 Dampak Positif
                    </h3>
                    <p className="text-sm text-muted-foreground">{result.environmentalImpact}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {result.isValuable && (
                    <>
                      <Button onClick={listToMarket} className="w-full gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Listingkan ke Market
                      </Button>
                      <CreateListingDialog
                        hideTrigger
                        externalOpen={showListingDialog}
                        onOpenChange={setShowListingDialog}
                        prefillData={getListingPrefillData()}
                        onSuccess={() => {
                          setShowListingDialog(false);
                          navigate("/market");
                        }}
                      />
                    </>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={shareToTwitter}
                      className="gap-2"
                    >
                      <Twitter className="h-4 w-4" />
                      Twitter
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={shareToInstagram}
                      className="gap-2"
                    >
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={downloadShareImage}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={copyCaption}
                      className="gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Salin Caption
                    </Button>
                  </div>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Ide app ini dibuat oleh <span className="font-semibold text-primary">@4anakmasadepan</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Scan;
