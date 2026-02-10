import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Package, Trash2, CheckCircle, Edit } from "lucide-react";
import { useMarket, MarketListing } from "@/hooks/useMarket";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import EditListingDialog from "./EditListingDialog";

const MyListingsSheet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { myListings, deleteListing, markAsSold } = useMarket();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !user) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/auth");
      return;
    }
    setOpen(newOpen);
  };

  const handleDelete = async (id: string) => {
    await deleteListing(id);
  };

  const handleMarkAsSold = async (id: string) => {
    await markAsSold(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Aktif</Badge>;
      case "sold":
        return <Badge variant="secondary">Terjual</Badge>;
      case "inactive":
        return <Badge variant="outline">Nonaktif</Badge>;
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package className="h-4 w-4" />
          Listing Saya
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Listing Saya</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {myListings.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada listing</p>
              <p className="text-sm text-muted-foreground">
                Mulai jual sampah Anda sekarang!
              </p>
            </div>
          ) : (
            myListings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{listing.image_emoji || "♻️"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {listing.name}
                        </h3>
                        {getStatusBadge(listing.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {listing.category} • {listing.weight}
                      </p>
                      <p className="text-primary font-semibold mt-1">
                        Rp {listing.price.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {listing.status === "active" && (
                    <div className="flex gap-2 mt-4">
                      <EditListingDialog listing={listing} />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => handleMarkAsSold(listing.id)}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Terjual
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-1">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Listing?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus listing "{listing.name}"? 
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(listing.id)}>
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MyListingsSheet;
