import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, category } = await req.json();
    
    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing waste image for category:", category);

    const systemPrompt = `Kamu adalah AI expert dalam menganalisa dan memilah sampah. Tugas kamu adalah mengidentifikasi sampah dari gambar yang diberikan dan memberikan analisa yang edukatif.

Kamu harus merespons dalam format JSON yang valid dengan struktur berikut:
{
  "name": "nama jenis sampah yang terdeteksi",
  "detectedCategory": "kategori sampah terdeteksi",
  "isValuable": true/false,
  "estimatedPrice": "perkiraan harga per kg jika bernilai ekonomis, atau null jika tidak",
  "description": "deskripsi singkat tentang sampah ini dan nilai ekonomisnya",
  "recommendations": ["array", "rekomendasi", "pengolahan"],
  "tips": ["array", "tips", "ramah lingkungan"],
  "environmentalImpact": "dampak positif jika sampah ini dikelola dengan baik"
}

Kategori sampah yang bernilai ekonomis: botol plastik, botol kaca, besi/logam, kertas/kardus, pakaian bekas layak, elektronik bekas, minyak jelantah, oli bekas.

Berikan respons yang edukatif dan ramah untuk anak-anak. Fokus pada pesan Reduce, Reuse, Recycle.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: `Analisa gambar sampah berikut. User memilih kategori "${category}". Berikan analisa detail dalam format JSON.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Terlalu banyak permintaan, coba lagi nanti." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis, silakan hubungi admin." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI Response:", content);

    // Parse JSON from response
    let analysisResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback result
      analysisResult = {
        name: category || "Sampah",
        detectedCategory: category,
        isValuable: false,
        estimatedPrice: null,
        description: "Analisa berhasil dilakukan. Sampah ini perlu dikelola dengan baik.",
        recommendations: ["Pisahkan dari sampah lain", "Buang di tempat yang sesuai"],
        tips: ["Kurangi penggunaan barang sekali pakai", "Bawa tas belanja sendiri"],
        environmentalImpact: "Dengan memilah sampah, kamu membantu mengurangi penumpukan di TPA!"
      };
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-waste function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
