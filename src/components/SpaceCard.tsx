import { MapPin, Ruler } from "lucide-react";
import type { Space } from "@/hooks/useSpaces";
import { getSpaceImage } from "@/lib/spaceImages";

interface SpaceCardProps {
	space: Space;
	index: number;
	onSelect: (space: Space) => void;
}

export function SpaceCard({ space, index, onSelect }: SpaceCardProps) {
	const image = getSpaceImage(space.name, space.image_url, index);
	const squareMeters = space.square_meters;

	return (
		<div
			className="group cursor-pointer rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-up"
			style={{ animationDelay: `${index * 100}ms` }}
			onClick={() => onSelect(space)}
		>
			<div className="aspect-[4/3] overflow-hidden">
				<img
					src={image}
					alt={space.name}
					loading="lazy"
					width={800}
					height={544}
					className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
				/>
			</div>
			<div className="p-5">
				<h3 className="font-heading text-xl font-semibold text-foreground mb-1">
					{space.name}
				</h3>

				<div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
					<MapPin className="w-3.5 h-3.5" />
					{space.location}
				</div>

				{/* Square meters */}
				{squareMeters ? (
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
						<Ruler className="w-3 h-3" />
						<span>{squareMeters} m²</span>
					</div>
				) : null}

				{/* Daily price */}
				<p className="text-sm font-medium text-primary mb-2">
					₦{space.price.toLocaleString()} / day
				</p>

				{/* Description */}
				<p className="text-sm text-muted-foreground line-clamp-2 mb-4">
					{space.description}
				</p>

				<button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
					View &amp; Book
				</button>
			</div>
		</div>
	);
}