import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Star, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND, type Tour } from "@/lib/mockData";

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <Card className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 pt-0 gap-0 pb-0">
      <Link to="/tours/$tourId" params={{ tourId: tour.id }} className="block relative overflow-hidden">
        <img
          src={tour.image}
          alt={tour.title}
          loading="lazy"
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {tour.oldPrice && (
          <Badge className="absolute top-3 left-3 bg-destructive">
            -{Math.round((1 - tour.price / tour.oldPrice) * 100)}%
          </Badge>
        )}
        <Badge className="absolute top-3 right-3 bg-white/95 text-foreground hover:bg-white">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
          {tour.rating}
        </Badge>
      </Link>
      <div className="p-5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3" /> {tour.destination}
          <span className="mx-1">·</span>
          <Clock className="h-3 w-3" /> {tour.days}N{tour.nights}Đ
          <span className="mx-1">·</span>
          <Users className="h-3 w-3" /> Còn {tour.seatsLeft} chỗ
        </div>
        <Link to="/tours/$tourId" params={{ tourId: tour.id }}>
          <h3 className="font-heading font-semibold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {tour.title}
          </h3>
        </Link>
        <div className="flex items-end justify-between mt-4 pt-4 border-t">
          <div>
            {tour.oldPrice && (
              <div className="text-xs text-muted-foreground line-through">{formatVND(tour.oldPrice)}</div>
            )}
            <div className="text-primary text-xl font-bold">{formatVND(tour.price)}</div>
          </div>
          <Button asChild size="sm">
            <Link to="/tours/$tourId" params={{ tourId: tour.id }}>Xem</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
