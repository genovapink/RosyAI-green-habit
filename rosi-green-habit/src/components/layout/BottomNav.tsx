import { Home, ShoppingBag, Scan, MessageCircle, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: ShoppingBag, label: "Market", path: "/market" },
  { icon: Scan, label: "Scan", path: "/scan" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: User, label: "Profil", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isScan = item.label === "Scan";
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isScan
                  ? "relative -mt-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg"
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5", isScan && "h-6 w-6")} />
              {!isScan && (
                <span className="text-xs font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
