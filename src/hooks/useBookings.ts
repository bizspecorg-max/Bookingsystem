import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define types locally since they're not exported
export interface Booking {
	id: string;
	space_id: string;
	start_date: string;
	end_date: string;
	first_name: string;
	email: string;
	phone: string;
	user_location: string | null;
	status: "pending" | "paid" | "cancelled";
	total_price: number | null;
	created_at: string;
}

export interface CreateBookingInput {
	space_id: string;
	start_date: string;
	end_date: string;
	first_name: string;
	email: string;
	phone: string;
	user_location?: string | null;
	total_price?: number;
	status?: "pending" | "paid" | "cancelled";
}

// Type for Supabase insert data
type BookingInsert = Omit<Booking, "id" | "created_at">;

export function useBookingsForSpace(spaceId: string | null) {
	return useQuery({
		queryKey: ["bookings", spaceId],
		enabled: !!spaceId,
		queryFn: async () => {
			console.log("📅 Fetching bookings for space:", spaceId);

			const { data, error } = await supabase
				.from("bookings")
				.select("*")
				.eq("space_id", spaceId!)
				.in("status", ["pending", "paid"]);

			if (error) {
				console.error("❌ Error fetching bookings:", error);
				throw error;
			}

			console.log(`✅ Found ${data?.length || 0} bookings for space`);
			return data as Booking[];
		},
	});
}

export function useCreateBooking() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (booking: CreateBookingInput): Promise<Booking> => {
			console.log("📝 Creating new booking:", booking);

			// Validate required fields
			if (!booking.space_id) {
				throw new Error("Space ID is required");
			}
			if (!booking.start_date || !booking.end_date) {
				throw new Error("Both start_date and end_date are required");
			}
			if (!booking.first_name || !booking.email || !booking.phone) {
				throw new Error("First name, email, and phone are required");
			}

			// Validate date range
			if (booking.start_date > booking.end_date) {
				throw new Error("End date must be after start date");
			}

			// Calculate total price if not provided
			let totalPrice = booking.total_price;
			if (!totalPrice) {
				const { data: space, error: spaceError } = await supabase
					.from("spaces")
					.select("price")
					.eq("id", booking.space_id)
					.single();

				if (spaceError) {
					console.error("Error fetching space price:", spaceError);
					throw new Error("Could not calculate total price");
				}

				const start = new Date(booking.start_date);
				const end = new Date(booking.end_date);
				const days =
					Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
					1;
				totalPrice = days * space.price;
			}

			// Prepare booking data with proper typing
			const bookingData: BookingInsert = {
				space_id: booking.space_id,
				start_date: booking.start_date,
				end_date: booking.end_date,
				first_name: booking.first_name,
				email: booking.email,
				phone: booking.phone,
				user_location: booking.user_location || null,
				total_price: totalPrice,
				status: booking.status || "pending",
			};

			console.log("📤 Submitting to Supabase:", bookingData);

			const { data, error } = await supabase
				.from("bookings")
				.insert(bookingData)
				.select()
				.single();

			if (error) {
				console.error("❌ Supabase error:", error);

				if (error.message?.includes("overlap") || error.code === "P0001") {
					throw new Error(
						"These dates are already booked. Please select different dates."
					);
				}

				if (error.code === "23505") {
					throw new Error("This booking conflicts with an existing booking.");
				}

				if (error.code === "23514") {
					throw new Error(
						"Invalid date range. End date must be after start date."
					);
				}

				throw new Error(
					error.message || "Failed to create booking. Please try again."
				);
			}

			console.log("✅ Booking created successfully:", data);
			return data as Booking;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["bookings", data.space_id] });
			queryClient.invalidateQueries({ queryKey: ["bookings", "all"] });
			queryClient.invalidateQueries({ queryKey: ["spaces"] });
		},
		onError: (error: Error) => {
			console.error("❌ Booking mutation error:", error);
		},
	});
}

export function useAllBookings() {
	return useQuery({
		queryKey: ["bookings", "all"],
		queryFn: async () => {
			console.log("📅 Fetching all bookings");

			const { data, error } = await supabase
				.from("bookings")
				.select("*, spaces(name, location)")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("❌ Error fetching all bookings:", error);
				throw error;
			}

			console.log(`✅ Found ${data?.length || 0} total bookings`);
			return data;
		},
	});
}

export function useUpdateBookingStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			bookingId,
			status,
		}: {
			bookingId: string;
			status: "pending" | "paid" | "cancelled";
		}) => {
			console.log(`🔄 Updating booking ${bookingId} status to ${status}`);

			const { data, error } = await supabase
				.from("bookings")
				.update({ status })
				.eq("id", bookingId)
				.select()
				.single();

			if (error) {
				console.error("❌ Error updating booking status:", error);
				throw error;
			}

			console.log("✅ Booking status updated:", data);
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["bookings", data.space_id] });
			queryClient.invalidateQueries({ queryKey: ["bookings", "all"] });
		},
	});
}

export function useDeleteBooking() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (bookingId: string) => {
			console.log(`🗑️ Deleting booking ${bookingId}`);

			const { data: booking, error: fetchError } = await supabase
				.from("bookings")
				.select("space_id")
				.eq("id", bookingId)
				.single();

			if (fetchError) throw fetchError;

			const { error } = await supabase
				.from("bookings")
				.delete()
				.eq("id", bookingId);

			if (error) {
				console.error("❌ Error deleting booking:", error);
				throw error;
			}

			console.log("✅ Booking deleted successfully");
			return { bookingId, spaceId: booking.space_id };
		},
		onSuccess: ({ spaceId }) => {
			queryClient.invalidateQueries({ queryKey: ["bookings", spaceId] });
			queryClient.invalidateQueries({ queryKey: ["bookings", "all"] });
		},
	});
}
