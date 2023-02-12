import enrollmentRepository from "@/repositories/enrollment-repository";
import { notFoundError, requestError, unauthorizedError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";

async function makingReserve(roomId: number, userId: number) {
  const enrollment = await enrollmentRepository.findEnrollmentByUserId(userId);
  const ticket = await bookingRepository.findValidTicketByEnrollmentId(enrollment.id);
  if (!ticket || ticket.TicketType.includesHotel !== true || ticket.status !== "PAID") {
    throw requestError(403, "There must be a valid ticket related to the user");
  }
  const room = await bookingRepository.findRoomById(roomId);
  if (!room) {
    throw notFoundError();
  }
  const checkVacancies = await bookingRepository.checkRoomVacancies(roomId);
  if (checkVacancies < 1) {
    throw requestError(403, "No vacancy");
  }
  const checkReservations = await bookingRepository.findBookingByUserId(userId);
  if (checkReservations) {
    throw requestError(403, "Already has a reservation");
  }
  return await bookingRepository.insertOrUpdateBooking(roomId, userId);
}

async function updateReserve(bookingId: number, userId: number, roomId: number) {
  const checkReservations = await bookingRepository.findBookingById(bookingId);
  if (!checkReservations) {
    throw requestError(403, "No reserves found");
  }
  if (checkReservations.userId !== userId) {
    throw unauthorizedError();
  }
  const room = await bookingRepository.findRoomById(roomId);
  if (!room) {
    throw notFoundError();
  }
  const checkVacancies = await bookingRepository.checkRoomVacancies(roomId);
  if (checkVacancies < 1) {
    throw requestError(403, "No vacancy");
  }

  return await bookingRepository.insertOrUpdateBooking(roomId, userId, bookingId);
}

async function findUserBooking(userId: number) {
  const book = await bookingRepository.findBookingByUserId(userId);
  if (!book) {
    throw notFoundError();
  }
  return {
    id: book.id,
    room: book.Room,
  };
}

const bookingService = {
  makingReserve,
  updateReserve,
  findUserBooking,
};

export default bookingService;
