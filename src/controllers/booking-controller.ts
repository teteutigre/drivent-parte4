import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";
import bookingService from "@/services/booking-service";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await bookingService.findUserBooking(req.userId);
    res.status(httpStatus.OK).send(result);
  } catch (error) {
    if (error.name === "NotFoundError") {
      res.sendStatus(httpStatus.NOT_FOUND);
    }
    res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await bookingService.makingReserve(req.body.roomId, req.userId);
    res.status(httpStatus.OK).send(result.id.toString());
  } catch (error) {
    if (error.name === "NotFoundError") {
      res.sendStatus(httpStatus.NOT_FOUND);
    } else if (error.name === "RequestError") {
      res.sendStatus(httpStatus.FORBIDDEN);
    }
    res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  }
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
  try {
    const { bookingId } = req.params;
    const roomId = req.body.roomId;
    const result = await bookingService.updateReserve(Number(bookingId), req.userId, roomId);
    res.status(httpStatus.OK).send(result.id.toString());
  } catch (error) {
    if (error.name === "NotFoundError") {
      res.sendStatus(httpStatus.NOT_FOUND);
    } else if (error.name === "RequestError") {
      res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === "UnauthorizedError") {
      res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  }
}
