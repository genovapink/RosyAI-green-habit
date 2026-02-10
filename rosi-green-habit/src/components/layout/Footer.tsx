import { Leaf, Recycle, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-8 mb-20 md:mb-0">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Leaf className="h-5 w-5" />
            <span className="font-bold text-lg">ROSi</span>
            <Leaf className="h-5 w-5" />
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Recycle className="h-4 w-4 text-primary" />
              Reduce
            </span>
            <span>•</span>
            <span>Reuse</span>
            <span>•</span>
            <span>Recycle</span>
          </div>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</a>
            <span>|</span>
            <a href="#" className="hover:text-primary transition-colors">Tentang Kami</a>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            © 2024 ROSi. Dibuat dengan <Heart className="h-3 w-3 text-destructive" /> untuk Bumi
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
