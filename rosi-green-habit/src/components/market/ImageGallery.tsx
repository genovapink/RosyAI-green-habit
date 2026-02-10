import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  emoji?: string | null;
}

const ImageGallery = ({ images, emoji }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const hasImages = images && images.length > 0;

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  if (!hasImages) {
    return (
      <div className="h-48 md:h-64 bg-accent flex items-center justify-center">
        <span className="text-8xl">{emoji || "♻️"}</span>
      </div>
    );
  }

  return (
    <>
      {/* Main Display */}
      <div className="relative">
        {/* Primary Image */}
        <div 
          className="h-48 md:h-64 bg-accent cursor-pointer"
          onClick={() => setSelectedIndex(0)}
        >
          <img
            src={images[0]}
            alt="Gambar utama"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 p-2 bg-background/80 backdrop-blur-sm">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedIndex === index ? "border-primary" : "border-transparent hover:border-primary/50"
                }`}
              >
                <img
                  src={img}
                  alt={`Gambar ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur-md">
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-2 right-2 z-10 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            <div className="flex items-center justify-center min-h-[50vh] max-h-[80vh]">
              {selectedIndex !== null && (
                <img
                  src={images[selectedIndex]}
                  alt={`Gambar ${selectedIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              )}
            </div>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  disabled={selectedIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedIndex === images.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    selectedIndex === index ? "bg-primary" : "bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGallery;
