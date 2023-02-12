import { getBooking, postBooking, putBooking } from "@/controllers/booking-controller";
import { authenticateToken } from "@/middlewares";
import { Router } from "express";

const bookingRouter = Router();

bookingRouter.all("/*", authenticateToken).post("", postBooking).put("/:bookingId", putBooking).get("", getBooking);

export { bookingRouter };
