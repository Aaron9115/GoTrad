// backend/test/return.test.js

const Return = require("../models/Return");
const Booking = require("../models/Booking");
const Dress = require("../models/Dress");
const {
  initiateReturn,
  getReturnById,
  reviewReturn,
  resolveDispute,
} = require("../controllers/returnController");

jest.mock("../models/Return");
jest.mock("../models/Booking");
jest.mock("../models/Dress");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Return Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("RT_UT_001 - Verify missing bookingId", () => {
    test("should return 400 if bookingId is missing", async () => {
      const req = {
        body: {},
        files: [],
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await initiateReturn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "bookingId is required",
      });
    });
  });

  describe("RT_UT_002 - Verify booking not found", () => {
    test("should return 404 if booking does not exist", async () => {
      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
      });

      const populateMock = Booking.findById();
      populateMock.populate = jest.fn().mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = {
        body: { bookingId: "booking1", condition: "good", comments: "Fine" },
        files: [{ filename: "img1.jpg", originalname: "img1.jpg" }],
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await initiateReturn(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Booking not found",
      });
    });
  });

  describe("RT_UT_003 - Verify photo upload validation", () => {
    test("should return 400 if no photos are uploaded", async () => {
      const mockBooking = {
        _id: "booking1",
        status: "confirmed",
        renter: { _id: { toString: () => "user1" } },
        dress: { _id: "dress1", owner: "owner1" },
      };

      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
      });

      const chain = Booking.findById();
      chain.populate = jest.fn().mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue(mockBooking),
      });

      Return.findOne.mockResolvedValue(null);

      const req = {
        body: { bookingId: "booking1", condition: "good", comments: "Fine" },
        files: [],
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await initiateReturn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Please upload at least one photo",
      });
    });
  });

  describe("RT_UT_004 - Verify successful return initiation", () => {
    test("should create return record and update booking status", async () => {
      const bookingSave = jest.fn().mockResolvedValue();

      const mockBooking = {
        _id: "booking1",
        status: "confirmed",
        renter: { _id: { toString: () => "user1" } },
        dress: { _id: "dress1", owner: "owner1" },
        save: bookingSave,
      };

      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
      });

      const chain = Booking.findById();
      chain.populate = jest.fn().mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue(mockBooking),
      });

      Return.findOne.mockResolvedValue(null);

      const mockReturnRecord = {
        _id: "return1",
        booking: "booking1",
        status: "pending",
      };

      Return.create.mockResolvedValue(mockReturnRecord);

      const req = {
        body: { bookingId: "booking1", condition: "good", comments: "Fine" },
        files: [{ filename: "img1.jpg", originalname: "img1.jpg" }],
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await initiateReturn(req, res);

      expect(Return.create).toHaveBeenCalled();
      expect(bookingSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Return initiated successfully. Owner will review the photos.",
        returnRecord: mockReturnRecord,
      });
    });
  });

  describe("RT_UT_005 - Verify invalid return ID format", () => {
    test("should return 400 if returnId format is invalid", async () => {
      const req = {
        params: { returnId: "abc123" },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await getReturnById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid return ID format",
      });
    });
  });

  describe("RT_UT_006 - Verify review return approval", () => {
    test("should approve return and update booking and dress", async () => {
      const returnSave = jest.fn().mockResolvedValue();
      const bookingSave = jest.fn().mockResolvedValue();
      const dressSave = jest.fn().mockResolvedValue();

      const mockReturn = {
        _id: "return1",
        owner: { toString: () => "owner1" },
        booking: "booking1",
        dress: "dress1",
        renterAssessment: { condition: "good" },
        save: returnSave,
      };

      Return.findById.mockResolvedValue(mockReturn);

      Booking.findById.mockResolvedValue({
        _id: "booking1",
        status: "returning",
        save: bookingSave,
      });

      Dress.findById.mockResolvedValue({
        _id: "dress1",
        name: "Test Dress",
        available: false,
        save: dressSave,
      });

      const req = {
        params: { returnId: "return1" },
        body: {
          condition: "good",
          comments: "Looks fine",
          hasDamage: false,
        },
        files: [],
        user: { _id: "owner1" },
      };
      const res = createMockRes();

      await reviewReturn(req, res);

      expect(bookingSave).toHaveBeenCalled();
      expect(dressSave).toHaveBeenCalled();
      expect(returnSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Return approved successfully. Dress is now available for rent.",
        returnRecord: mockReturn,
        dressStatus: {
          id: "dress1",
          name: "Test Dress",
          available: true,
        },
      });
    });
  });

  describe("RT_UT_007 - Verify dispute resolution", () => {
    test("should resolve disputed return and update booking and dress", async () => {
      const returnSave = jest.fn().mockResolvedValue();
      const bookingSave = jest.fn().mockResolvedValue();
      const dressSave = jest.fn().mockResolvedValue();

      const mockReturn = {
        _id: "return1",
        status: "disputed",
        booking: "booking1",
        dress: "dress1",
        save: returnSave,
      };

      Return.findById.mockResolvedValue(mockReturn);

      Booking.findById.mockResolvedValue({
        _id: "booking1",
        status: "returning",
        save: bookingSave,
      });

      Dress.findById.mockResolvedValue({
        _id: "dress1",
        name: "Test Dress",
        available: false,
        save: dressSave,
      });

      const req = {
        params: { returnId: "return1" },
        body: {
          resolution: "renter_pays",
          refundAmount: 800,
          notes: "Minor damage",
        },
        user: { _id: "admin1" },
      };
      const res = createMockRes();

      await resolveDispute(req, res);

      expect(returnSave).toHaveBeenCalled();
      expect(bookingSave).toHaveBeenCalled();
      expect(dressSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Dispute resolved successfully",
        returnRecord: mockReturn,
        dressStatus: {
          id: "dress1",
          name: "Test Dress",
          available: true,
        },
      });
    });
  });
});