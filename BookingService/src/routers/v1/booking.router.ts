import express from "express";
import { validateRequestBody } from "../../validators";
import { createBookingSchema } from "../../validators/booking.validator";
import { createBookingHandler, confirmBookingHandler } from "../../controllers/booking.controller";

const bookingRouter = express.Router();

bookingRouter.post(
  "/",
  validateRequestBody(createBookingSchema),
  createBookingHandler
);

bookingRouter.post("/confirm/:idempotencyKey", confirmBookingHandler);

export default bookingRouter;
