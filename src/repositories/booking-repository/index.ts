import { prisma } from "@/config";

async function findRoomById(roomId: number) {
  return prisma.room.findFirst({
    where: { id: roomId },
  });
}

async function checkRoomVacancies(roomId: number) {
  const room = await findRoomById(roomId);
  const reserves = await prisma.booking.findMany({
    where: { roomId },
  });
  return room.capacity - reserves.length;
}

async function insertOrUpdateBooking(roomId: number, userId: number, bookingId = 0) {
  return await prisma.booking.upsert({
    where: { id: bookingId },
    create: {
      userId,
      roomId,
    },
    update: {
      roomId,
    },
  });
}

async function findBookingById(bookingId: number) {
  return await prisma.booking.findFirst({
    where: { id: bookingId },
  });
}

async function findBookingByUserId(userId: number) {
  return await prisma.booking.findFirst({
    where: { userId },
    include: {
      Room: true,
    },
  });
}

async function findValidTicketByEnrollmentId(enrollmentId: number) {
  return prisma.ticket.findFirst({
    where: {
      enrollmentId,
    },
    include: {
      TicketType: true, //inner join
    },
  });
}

const bookingRepository = {
  findRoomById,
  checkRoomVacancies,
  insertOrUpdateBooking,
  findBookingByUserId,
  findBookingById,
  findValidTicketByEnrollmentId,
};

export default bookingRepository;
