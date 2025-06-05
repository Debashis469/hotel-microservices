import { z } from "zod";

export const createBookingSchema = z.object({
  userId: z.number({ message: "User ID is required" }),
  hotelId: z.number({ message: "Hotel ID is required" }),
  totalGuests: z
    .number({ message: "Total guests is required" })
    .min(1, { message: "Total guests must be at least 1" }),
  bookingAmount: z
    .number({ message: "Booking amount is required" })
    .min(0, { message: "Booking amount must be a positive number" }),
});
