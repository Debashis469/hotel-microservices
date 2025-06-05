import { IdempotencyKey, Prisma } from "@prisma/client";
import { validate as isValidUUID } from "uuid";

import prismaClient from "../prisma/client";
import { InternalServerError, NotFoundError } from "../utils/errors/app.error";

export async function createBooking(bookingInput: Prisma.BookingCreateInput) {
  const booking = await prismaClient.booking.create({
    data: bookingInput,
  });

  return booking;
}

export async function createIdempotencyKey(key: string, bookingId: number) {
  const idempotencyKey = await prismaClient.idempotencyKey.create({
    data: {
      key,
      booking: {
        connect: {
          id: bookingId,
        },
      },
    },
  });

  return idempotencyKey;
}

// Accept a Prisma transaction client as a parameter to run inside the txn
export async function getIdempotencyKey(
  tx: Prisma.TransactionClient,
  key: string
) {
  if (!isValidUUID(key)) {
    throw new InternalServerError("Invalid idempotency key format");
  }

  // Use raw query with FOR UPDATE inside the transaction to lock the row
  const idempotencyKey = await tx.$queryRaw<
    Array<IdempotencyKey>
  >`SELECT * FROM idempotencykey WHERE \`key\` = ${key} FOR UPDATE`;

  // result is an array, return first or null
  if (!idempotencyKey || idempotencyKey.length === 0) {
    throw new NotFoundError("Idempotency key not found");
  }

  return idempotencyKey[0];
}

export async function getBookingById(bookingId: number) {
  const booking = await prismaClient.booking.findUnique({
    where: {
      id: bookingId,
    },
  });

  return booking;
}

export async function changeBookingStatus(
  bookingId: number,
  status: Prisma.EnumBookingStatusFieldUpdateOperationsInput
) {
  const booking = await prismaClient.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: status,
    },
  });

  return booking;
}

export async function confirmBooking(
  tx: Prisma.TransactionClient,
  bookingId: number
) {
  const booking = await tx.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: "CONFIRMED",
    },
  });

  return booking;
}

export async function cancelBooking(bookingId: number) {
  const booking = await prismaClient.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: "CANCELLED",
    },
  });

  return booking;
}

export async function finalizeIdempotencyKey(
  tx: Prisma.TransactionClient,
  key: string
) {
  const idempotencyKey = await tx.idempotencyKey.update({
    where: {
      key,
    },
    data: {
      finalized: true,
    },
  });

  return idempotencyKey;
}
