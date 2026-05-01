import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAllBookings } from "@/hooks/useBookings";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-accent text-accent-foreground",
  paid: "bg-success text-success-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function Admin() {
  const { data: bookings, isLoading } = useAllBookings();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading text-xl font-bold text-foreground">
            Admin — All Bookings
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Space</th>
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 font-medium text-muted-foreground">Name</th>
                  <th className="pb-3 font-medium text-muted-foreground">Email</th>
                  <th className="pb-3 font-medium text-muted-foreground">Phone</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 font-medium">
                      {(b.spaces as { name: string } | null)?.name ?? "—"}
                    </td>
                    <td className="py-3 pr-4">{format(new Date(b.booking_date), "MMM d, yyyy")}</td>
                    <td className="py-3 pr-4">{b.first_name}</td>
                    <td className="py-3 pr-4">{b.email}</td>
                    <td className="py-3 pr-4">{b.phone}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={statusColors[b.status] || ""}>
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
