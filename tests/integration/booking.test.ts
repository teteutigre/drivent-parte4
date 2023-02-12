import app, { init } from "@/app";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import {
  createEnrollmentWithAddress,
  createUser,
  createTicket,
  createHotel,
  createRoomWithHotelId,
} from "../factories";
import {
  createBooking,
  createInvalidNoHotelTicketType,
  createInvalidTicketType,
  createRoomWithHotelIdCapacityZero,
  createValidTicketType,
} from "../factories/booking-factory.";
import { cleanDb, generateValidToken } from "../helpers";

const server = supertest(app);

beforeAll(async () => {
  await init();
});
beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
});

describe("GET /booking", () => {
  it("should respond with status 401 if no token", async () => {
    const result = await server.get("/booking");
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });
  it("should respond with status 401 if invalid token", async () => {
    const result = await server.get("/booking").set("Authorization", "Bearer XXXXX");
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });
  it("should responde with 404 if valid token but booking dont exists", async () => {
    const user = await createUser();
    const result = await server.get("/booking").set("Authorization", `Bearer ${await generateValidToken(user)}`);

    expect(result.status).toBe(httpStatus.NOT_FOUND);
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token", async () => {
    const result = await server.post("/booking");
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });
  it("should respond with status 401 if invalid token", async () => {
    const result = await server.post("/booking").set("Authorization", "Bearer XXXXX");
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });
  it("should respond with status 500 if valid token but no body was found", async () => {
    const user = await createUser();
    const result = await server.post("/booking").set("Authorization", `Bearer ${await generateValidToken(user)}`);
    expect(result.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
  });
  it("should respond with status 403 if valid token but user has no ticket", async () => {
    const user = await createUser();
    await createEnrollmentWithAddress(user);
    const body = { roomId: 1 };
    const result = await server
      .post("/booking")
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.FORBIDDEN);
  });
  it("should respond with 403 if valid token but user has no presencial tickets", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    const ticket = await createInvalidTicketType();
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    await createTicket(enrollment.id, ticket.id, "PAID");
    const body = { roomId: room.id };
    const result = await server
      .post("/booking")
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.FORBIDDEN);
  });
  it("should respond with 403 if valid token but has no hotel tickets", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const ticket = await createInvalidNoHotelTicketType();
    await createTicket(enrollment.id, ticket.id, "PAID");
    const body = { roomId: room.id };
    const result = await server
      .post("/booking")
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.FORBIDDEN);
  });
  it("should respond with 403 if valid token but has no presencial ticket PAIDS", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const ticket = await createValidTicketType();
    await createTicket(enrollment.id, ticket.id, "RESERVED");
    const body = { roomId: room.id };
    const result = await server
      .post("/booking")
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.FORBIDDEN);
  });
  it("should respond with 404 if valid token and ticket but room is not found", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    await createHotel();
    const ticket = await createValidTicketType();
    await createTicket(enrollment.id, ticket.id, "PAID");
    const body = { roomId: 1 };
    const result = await server
      .post("/booking")
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.NOT_FOUND);
  });
  it("should respond with 404 if valid token and ticket but room has no vacancies", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelIdCapacityZero(hotel.id);
    const ticket = await createValidTicketType();
    await createTicket(enrollment.id, ticket.id, "PAID");
    const body = { roomId: room.id };
    const result = await server
      .post("/booking")
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.FORBIDDEN);
  });
  it("should respond with 404 if valid token and ticket but user already has a booking", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const ticket = await createValidTicketType();
    await createTicket(enrollment.id, ticket.id, "PAID");
    await createBooking(user.id, room.id);
    const body = { roomId: room.id };
    const result = await server
      .post("/booking")
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.FORBIDDEN);
  });
  it("should respond with 200 and a number if everything is right", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const ticket = await createValidTicketType();
    await createTicket(enrollment.id, ticket.id, "PAID");
    const body = { roomId: room.id };
    const result = await server
      .post("/booking")
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.OK);
    expect(Number(result.text)).toBeGreaterThan(0);
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 401 if no token", async () => {
    const result = await server.put("/booking/1");
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });
  it("should respond with status 401 if invalid token", async () => {
    const result = await server.put("/booking/1").set("Authorization", "Bearer XXXXX");
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });
  it("should respond with status 500 if valid token but no body was found", async () => {
    const user = await createUser();
    const result = await server.put("/booking/1").set("Authorization", `Bearer ${await generateValidToken(user)}`);
    expect(result.status).toBe(httpStatus.FORBIDDEN);
  });
  it("should respond with status 500 if valid token but params not valid", async () => {
    const user = await createUser();
    const result = await server.put("/booking/a").set("Authorization", `Bearer ${await generateValidToken(user)}`);
    expect(result.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
  });
  it("should respond with 403 if valid token and no booking is found", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const ticket = await createValidTicketType();
    await createTicket(enrollment.id, ticket.id, "PAID");
    const body = { roomId: room.id };
    const result = await server
      .put("/booking/1")
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.FORBIDDEN);
  });
  it("should respond with 401 if valid token and booking doesnt belong to the user", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const ticket = await createValidTicketType();
    await createTicket(enrollment.id, ticket.id, "PAID");
    const body = { roomId: room.id };
    const bookingUser = await createUser();
    const booking = await createBooking(bookingUser.id, room.id);
    const result = await server
      .put(`/booking/${booking.id}`)
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });
  it("should respond with 404 if valid token but room is not found", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const ticket = await createValidTicketType();
    await createTicket(enrollment.id, ticket.id, "PAID");
    const body = { roomId: faker.datatype.number() };
    const booking = await createBooking(user.id, room.id);
    const result = await server
      .put(`/booking/${booking.id}`)
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.NOT_FOUND);
  });
  it("should respond with 403 if valid token but room is whitout vacancies", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const booking = await createBooking(user.id, room.id);
    const newRoom = await createRoomWithHotelIdCapacityZero(hotel.id);
    const ticket = await createValidTicketType();
    await createTicket(enrollment.id, ticket.id, "PAID");
    const body = { roomId: newRoom.id };
    const result = await server
      .put(`/booking/${booking.id}`)
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.FORBIDDEN);
  });
  it("should respond with 200 and a number if everything is right", async () => {
    const user = await createUser();
    const enrollment = await createEnrollmentWithAddress(user);
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    const booking = await createBooking(user.id, room.id);
    const newRoom = await createRoomWithHotelId(hotel.id);
    const ticket = await createValidTicketType();
    await createTicket(enrollment.id, ticket.id, "PAID");
    const body = { roomId: newRoom.id };
    const result = await server
      .put(`/booking/${booking.id}`)
      .set("Authorization", `Bearer ${await generateValidToken(user)}`)
      .send(body);
    expect(result.status).toBe(httpStatus.OK);
    expect(Number(result.text)).toBeGreaterThan(0);
  });
});
