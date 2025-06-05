import { createBookingDTO } from "./../dto/booking.dto";
import {
  createBooking,
  createIdempotencyKey,
  getIdempotencyKey,
  confirmBooking,
  finalizeIdempotencyKey,
} from "../repositories/booking.repository";
import { generateIdempotencyKey } from "../utils/helpers/generateIdempotencyKey";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../utils/errors/app.error";
import { redlock } from "../config/redis.config";
import prismaClient from "../prisma/client";
import { serverConfig } from "../config";

export async function createBookingService(createBookingDTO: createBookingDTO) {
  const ttl = serverConfig.LOCK_TTL;
  const bookingResource = `hotel:${createBookingDTO.hotelId}`;

  let lock;
  try {
    lock = await redlock.acquire([bookingResource], ttl);
    console.log(`Acquired lock for booking resource: ${bookingResource}`, lock);
    const booking = await createBooking({
      userId: createBookingDTO.userId,
      hotelId: createBookingDTO.hotelId,
      totalGuests: createBookingDTO.totalGuests,
      bookingAmount: createBookingDTO.bookingAmount,
    });

    const idempotencyKey = generateIdempotencyKey();

    await createIdempotencyKey(idempotencyKey, booking.id);
    return {
      bookingId: booking.id,
      idempotencyKey: idempotencyKey,
    };
  } catch (error) {
    throw new InternalServerError(
      "Failed to acquire lock for booking creation"
    );
  } 
}

export async function confirmBookingService(idempotencyKey: string) {
  return await prismaClient.$transaction(async (tx) => {
    // Fetch the idempotency key with a lock
    const idempotencyKeyData = await getIdempotencyKey(tx, idempotencyKey);
    if (!idempotencyKeyData) {
      throw new NotFoundError("Idempotency key not found");
    }

    if (idempotencyKeyData.finalized) {
      throw new BadRequestError("Booking already finalized");
    }

    if (idempotencyKeyData.bookingId === null) {
      throw new NotFoundError(
        "Booking ID is missing for the provided idempotency key"
      );
    }

    const booking = await confirmBooking(tx, idempotencyKeyData.bookingId);

    await finalizeIdempotencyKey(tx, idempotencyKey);

    return booking;
  });
}
