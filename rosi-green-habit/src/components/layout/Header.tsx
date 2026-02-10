import { Link, useLocation } from "react-router-dom";
import { Bell, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import rosiMascot from "@/assets/rosi-mascot.png";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Market", path: "/market" },
  { label: "Scan", path: "/scan" },
  { label: "Chat", path: "/chat" },
  { label: "Profil", path: "/profile" },
];

const Header = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={rosiMascot} alt="ROSi" className="h-10 w-10 rounded-full" />
            <span className="text-xl font-bold text-primary">ROSi</span>
            <Leaf className="h-4 w-4 text-primary" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button className="p-2 rounded-full hover:bg-accent transition-colors">
            <Bell className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
