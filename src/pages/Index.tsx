import { useState } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { useSpaces, type Space } from "@/hooks/useSpaces";
import { SpaceCard } from "@/components/SpaceCard";
import { BookingModal } from "@/components/BookingModal";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export default function Index() {
	const { data: spaces, isLoading } = useSpaces();
	const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [search, setSearch] = useState("");

	const filtered = spaces?.filter(
		(s) =>
			s.name.toLowerCase().includes(search.toLowerCase()) ||
			s.location.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div className="min-h-screen bg-background">
			{/* Header with Logo */}
			<header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
				<div className="container mx-auto px-4 py-4 flex items-center justify-between">
					<Link
						to="/"
						className="flex items-center gap-2 hover:opacity-80 transition-opacity"
					>
						<img
							src="https://res.cloudinary.com/dfmigbgri/image/upload/v1777658532/WhatsApp_Image_2026-05-01_at_15.43.08__1_-removebg-preview_o5pjuq.png"
							alt="SpaceBook Logo"
							className="h-16 w-auto"
						/>
					</Link>
					<Link
						to="/admin"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Admin
					</Link>
				</div>
			</header>

			{/* Hero Section */}
			<section className="container mx-auto px-4 pt-16 pb-10 text-center">
				<h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-up">
					Find your perfect space
				</h2>
				<p
					className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6 animate-fade-up"
					style={{ animationDelay: "100ms" }}
				>
					We rent out retail space to creatives and brands so they can showcase
					and sell their products without the cost or commitment of a permanent
					store.
				</p>
				<p
					className="text-muted-foreground text-md max-w-xl mx-auto mb-8 animate-fade-up"
					style={{ animationDelay: "150ms" }}
				>
					Browse curated studios, lofts, and venues. Book instantly with zero
					hassle.
				</p>

				<div
					className="relative max-w-md mx-auto animate-fade-up"
					style={{ animationDelay: "200ms" }}
				>
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Search by name or location..."
						className="pl-10"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
			</section>

			{/* Spaces Grid */}
			<section className="container mx-auto px-4 pb-20">
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
					</div>
				) : filtered && filtered.length > 0 ? (
					<>
						<div className="mb-6 text-center">
							<p className="text-muted-foreground">
								Found {filtered.length} space{filtered.length !== 1 ? "s" : ""}{" "}
								for you
							</p>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{filtered.map((space, i) => (
								<SpaceCard
									key={space.id}
									space={space}
									index={i}
									onSelect={(s) => {
										setSelectedSpace(s);
										setSelectedIndex(i);
									}}
								/>
							))}
						</div>
					</>
				) : (
					<div className="text-center py-20">
						<p className="text-muted-foreground mb-2">No spaces found.</p>
						<p className="text-sm text-muted-foreground">
							Try adjusting your search criteria
						</p>
					</div>
				)}
			</section>

			{/* CTA Section - WhatsApp Contact */}
			<section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16 mt-8">
				<div className="container mx-auto px-4 text-center">
					<h3 className="text-2xl font-bold text-foreground mb-4">
						Ready to showcase your brand?
					</h3>
					<p className="text-muted-foreground mb-6 max-w-md mx-auto">
						Join hundreds of creatives who've found their perfect retail space
						with us.
					</p>
					<a
						href="https://wa.me/447501464966"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
					>
						Contact Us on WhatsApp
					</a>
				</div>
			</section>

			{/* Booking Modal */}
			<BookingModal
				space={selectedSpace}
				index={selectedIndex}
				open={!!selectedSpace}
				onClose={() => setSelectedSpace(null)}
			/>
		</div>
	);
}
