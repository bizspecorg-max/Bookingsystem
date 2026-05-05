import { useState } from "react";
import { format, isBefore, startOfDay, differenceInDays } from "date-fns";
import { CalendarIcon, X, CheckCircle2, Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import type { Space } from "@/hooks/useSpaces";
import { useBookingsForSpace, useCreateBooking } from "@/hooks/useBookings";
import { getSpaceImage } from "@/lib/spaceImages";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

interface BookingModalProps {
	space: Space | null;
	index: number;
	open: boolean;
	onClose: () => void;
}

interface BookedRange {
	start_date: string;
	end_date: string;
}

export function BookingModal({
	space,
	index,
	open,
	onClose,
}: BookingModalProps) {
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
	const [step, setStep] = useState<"date" | "form" | "success">("date");
	const [form, setForm] = useState({
		firstName: "",
		email: "",
		phone: "",
		location: "",
	});
	const [dateError, setDateError] = useState<string | null>(null);

	const { data: bookings, isLoading: loadingBookings } = useBookingsForSpace(
		space?.id ?? null
	);
	const createBooking = useCreateBooking();

	// Extract booked date ranges
	const bookedRanges: BookedRange[] =
		bookings?.map((booking) => ({
			start_date: booking.start_date,
			end_date: booking.end_date,
		})) || [];

	const isDateBlocked = (date: Date): boolean => {
		const dateStr = format(date, "yyyy-MM-dd");
		for (const range of bookedRanges) {
			if (dateStr >= range.start_date && dateStr <= range.end_date) {
				return true;
			}
		}
		return false;
	};

	const isRangeOverlapping = (from: Date, to: Date): boolean => {
		const newStart = format(from, "yyyy-MM-dd");
		const newEnd = format(to, "yyyy-MM-dd");
		for (const range of bookedRanges) {
			if (newStart <= range.end_date && newEnd >= range.start_date) {
				return true;
			}
		}
		return false;
	};

	const isDateDisabled = (date: Date) => {
		if (isBefore(date, startOfDay(new Date()))) return true;
		return isDateBlocked(date);
	};

	const handleDateSelect = (range: DateRange | undefined) => {
		setDateError(null);
		if (!range?.from) {
			setDateRange(undefined);
			return;
		}
		if (!range.to) {
			setDateRange({ from: range.from, to: undefined });
		} else {
			const from = range.from;
			const to = range.to;
			if (isRangeOverlapping(from, to)) {
				const errorMsg =
					"❌ Space not available on these dates. Please choose different dates.";
				setDateError(errorMsg);
				toast.error(errorMsg);
				setDateRange(undefined);
				return;
			}
			setDateRange({ from, to });
		}
	};

	const handleContinueToForm = () => {
		if (dateRange?.from && dateRange?.to) {
			setStep("form");
		} else {
			toast.error("Please select both start and end dates");
		}
	};

	// Helper to calculate total price including one-time fees
	const getTotalPrice = () => {
		if (!space || !dateRange?.from || !dateRange?.to) return 0;
		const days = differenceInDays(dateRange.to, dateRange.from) + 1;
		const rental = days * space.price;
		const service = space.service_charge ?? 0;
		const caution = space.caution_fee ?? 0;
		return rental + service + caution;
	};

	const totalPrice = getTotalPrice();
	const numberOfDays =
		dateRange?.from && dateRange?.to
			? differenceInDays(dateRange.to, dateRange.from) + 1
			: 0;

	const rentalAmount = numberOfDays * (space?.price ?? 0);
	const serviceCharge = space?.service_charge ?? 0;
	const cautionFee = space?.caution_fee ?? 0;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!space || !dateRange?.from || !dateRange?.to) return;

		if (isRangeOverlapping(dateRange.from, dateRange.to)) {
			toast.error(
				"Space not available – those dates are already booked. Please try another range."
			);
			setStep("date");
			setDateRange(undefined);
			return;
		}

		try {
			await createBooking.mutateAsync({
				space_id: space.id,
				start_date: format(dateRange.from, "yyyy-MM-dd"),
				end_date: format(dateRange.to, "yyyy-MM-dd"),
				first_name: form.firstName,
				email: form.email,
				phone: form.phone,
				user_location: form.location || null,
				total_price: totalPrice,
				status: "pending",
			});
			setStep("success");
			toast.success(`Booking request submitted for ${numberOfDays} day(s)!`);
		} catch (error: unknown) {
			console.error("Booking error:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to create booking";
			if (errorMessage.includes("overlap")) {
				toast.error(
					"These dates were just booked by someone else. Please pick different dates."
				);
				setStep("date");
				setDateRange(undefined);
			} else {
				toast.error(errorMessage);
			}
		}
	};

	const handleClose = () => {
		setStep("date");
		setDateRange(undefined);
		setDateError(null);
		setForm({ firstName: "", email: "", phone: "", location: "" });
		onClose();
	};

	if (!space) return null;

	const image = getSpaceImage(space.name, space.image_url, index);
	const isPending = createBooking.isPending;

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0">
				<div className="relative h-48 overflow-hidden rounded-t-lg">
					<img
						src={image}
						alt={space.name}
						className="w-full h-full object-cover"
					/>
					<button
						onClick={handleClose}
						className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<div className="p-6">
					<DialogHeader className="text-left mb-4">
						<DialogTitle className="font-heading text-2xl">
							{space.name}
						</DialogTitle>
						<p className="text-sm text-muted-foreground">{space.location}</p>
						<p className="text-sm font-semibold text-primary mt-1">
							₦{space.price.toLocaleString()}/day
						</p>
					</DialogHeader>

					<p className="text-sm text-muted-foreground mb-6">
						{space.description}
					</p>

					{step === "date" && (
						<div className="animate-fade-up">
							<h4 className="font-medium text-sm mb-3">
								{!dateRange?.from
									? "Select start date"
									: !dateRange?.to
										? "Select end date"
										: "Dates selected"}
							</h4>
							{loadingBookings ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
								</div>
							) : (
								<>
									<Calendar
										mode="range"
										selected={dateRange}
										onSelect={handleDateSelect}
										disabled={isDateDisabled}
										className="rounded-lg border p-3 pointer-events-auto mx-auto"
										numberOfMonths={2}
									/>
									{dateError && (
										<div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
											{dateError}
										</div>
									)}
									{dateRange?.from && dateRange?.to && (
										<div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-2">
											<div className="flex justify-between items-center mb-2">
												<span className="text-sm font-medium">
													Selected Dates:
												</span>
												<button
													type="button"
													className="text-xs text-primary underline"
													onClick={() => {
														setDateRange(undefined);
														setDateError(null);
													}}
												>
													Clear
												</button>
											</div>
											<p className="text-sm">
												{format(dateRange.from, "MMM d, yyyy")} -{" "}
												{format(dateRange.to, "MMM d, yyyy")}
											</p>
											<div className="border-t pt-2 mt-2 space-y-1">
												<div className="flex justify-between text-sm">
													<span>
														{numberOfDays} day{numberOfDays !== 1 ? "s" : ""} ×
														₦{space.price.toLocaleString()}
													</span>
													<span>₦{rentalAmount.toLocaleString()}</span>
												</div>
												{serviceCharge > 0 && (
													<div className="flex justify-between text-sm">
														<span>Service charge (one‑time)</span>
														<span>₦{serviceCharge.toLocaleString()}</span>
													</div>
												)}
												{cautionFee > 0 && (
													<div className="flex justify-between text-sm">
														<span>Caution fee (non‑refundable, one‑time)</span>
														<span>₦{cautionFee.toLocaleString()}</span>
													</div>
												)}
											</div>
											<div className="flex justify-between font-bold pt-2 border-t">
												<span>Total</span>
												<span>₦{totalPrice.toLocaleString()}</span>
											</div>
										</div>
									)}
									<Button
										onClick={handleContinueToForm}
										disabled={!dateRange?.from || !dateRange?.to}
										className="w-full mt-4"
									>
										Continue to Booking
									</Button>
								</>
							)}
						</div>
					)}

					{step === "form" && dateRange?.from && dateRange?.to && (
						<form onSubmit={handleSubmit} className="space-y-4 animate-fade-up">
							<div className="flex items-center gap-2 p-3 rounded-lg bg-accent text-accent-foreground text-sm">
								<CalendarIcon className="w-4 h-4" />
								<span className="font-medium">
									{format(dateRange.from, "MMM d")} -{" "}
									{format(dateRange.to, "MMM d, yyyy")}
								</span>
								<span className="ml-auto font-semibold">
									₦{totalPrice.toLocaleString()}
								</span>
								<button
									type="button"
									className="ml-2 text-xs underline"
									onClick={() => setStep("date")}
								>
									Change
								</button>
							</div>

							<div className="space-y-3">
								<div>
									<Label htmlFor="firstName">First Name *</Label>
									<Input
										id="firstName"
										required
										maxLength={100}
										value={form.firstName}
										onChange={(e) =>
											setForm((f) => ({ ...f, firstName: e.target.value }))
										}
									/>
								</div>
								<div>
									<Label htmlFor="email">Email *</Label>
									<Input
										id="email"
										type="email"
										required
										maxLength={255}
										value={form.email}
										onChange={(e) =>
											setForm((f) => ({ ...f, email: e.target.value }))
										}
									/>
								</div>
								<div>
									<Label htmlFor="phone">Phone *</Label>
									<Input
										id="phone"
										type="tel"
										required
										maxLength={30}
										value={form.phone}
										onChange={(e) =>
											setForm((f) => ({ ...f, phone: e.target.value }))
										}
									/>
								</div>
								<div>
									<Label htmlFor="location">Your Location</Label>
									<Input
										id="location"
										maxLength={200}
										value={form.location}
										onChange={(e) =>
											setForm((f) => ({ ...f, location: e.target.value }))
										}
									/>
								</div>
							</div>

							<div className="bg-muted/30 p-3 rounded-lg space-y-1 text-sm">
								<div className="flex justify-between">
									<span>
										{numberOfDays} day(s) × ₦{space.price.toLocaleString()}
									</span>
									<span>₦{rentalAmount.toLocaleString()}</span>
								</div>
								{serviceCharge > 0 && (
									<div className="flex justify-between">
										<span>Service charge (one‑time)</span>
										<span>₦{serviceCharge.toLocaleString()}</span>
									</div>
								)}
								{cautionFee > 0 && (
									<div className="flex justify-between">
										<span>Caution fee (non‑refundable, one‑time)</span>
										<span>₦{cautionFee.toLocaleString()}</span>
									</div>
								)}
								<div className="flex justify-between font-bold pt-2 border-t mt-2">
									<span>Total</span>
									<span>₦{totalPrice.toLocaleString()}</span>
								</div>
							</div>

							<Button type="submit" className="w-full" disabled={isPending}>
								{isPending ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting
										Booking...
									</>
								) : (
									`Confirm Booking - ₦${totalPrice.toLocaleString()}`
								)}
							</Button>
						</form>
					)}

					{step === "success" && (
						<div className="text-center py-8 animate-fade-up">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
								<CheckCircle2 className="w-8 h-8 text-green-600" />
							</div>
							<h3 className="font-heading text-xl font-semibold mb-2">
								Booking Request Sent!
							</h3>
							<p className="text-sm text-muted-foreground mb-1">{space.name}</p>
							<p className="text-sm font-medium">
								{dateRange?.from &&
									dateRange?.to &&
									`${format(dateRange.from, "MMMM d")} - ${format(dateRange.to, "MMMM d, yyyy")}`}
							</p>
							<p className="text-xs text-muted-foreground mt-2 mb-6">
								Total: ₦{totalPrice.toLocaleString()} • {numberOfDays} days
							</p>
							<p className="text-xs text-muted-foreground mb-6">
								A confirmation will be sent to {form.email}
							</p>
							<Button onClick={handleClose} variant="outline">
								Done
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
