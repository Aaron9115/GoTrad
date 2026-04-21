// backend/test/booking.test.js

const Booking = require("../models/Booking");
const Dress = require("../models/Dress");
const {
  createBooking,
  confirmBooking,
  cancelBooking,
  processRefund,
  deleteBooking,
} = require("../controllers/bookingController");

jest.mock("../models/Booking");
jest.mock("../models/Dress");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Booking Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("BK_UT_001 - Verify missing required fields", () => {
    test("should return 400 if required booking fields are missing", async () => {
      const req = {
        body: {
          dressId: "",
          startDate: "",
          endDate: "",
          address: "",
          city: "",
          phone: "",
        },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "All fields are required",
      });
    });
  });

  describe("BK_UT_002 - Verify invalid delivery method", () => {
    test("should return 400 if deliveryMethod is invalid", async () => {
      const req = {
        body: {
          dressId: "dress1",
          startDate: "2026-04-10",
          endDate: "2026-04-12",
          address: "Street 1",
          city: "Lahore",
          phone: "1234567890",
          deliveryMethod: "invalid",
          agreedToTerms: true,
          agreedToDigitalAgreement: true,
        },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Delivery method must be 'pickup' or 'delivery'",
      });
    });
  });

  describe("BK_UT_003 - Verify terms agreement validation", () => {
    test("should return 400 if agreedToTerms is false", async () => {
      const req = {
        body: {
          dressId: "dress1",
          startDate: "2026-04-10",
          endDate: "2026-04-12",
          address: "Street 1",
          city: "Kathmandu",
          phone: "1234567890",
          deliveryMethod: "pickup",
          agreedToTerms: false,
          agreedToDigitalAgreement: true,
        },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "You must agree to the terms and conditions",
      });
    });
  });

  describe("BK_UT_004 - Verify digital agreement validation", () => {
    test("should return 400 if agreedToDigitalAgreement is false", async () => {
      const req = {
        body: {
          dressId: "dress1",
          startDate: "2026-04-10",
          endDate: "2026-04-12",
          address: "Street 1",
          city: "Kathmandu",
          phone: "1234567890",
          deliveryMethod: "pickup",
          agreedToTerms: true,
          agreedToDigitalAgreement: false,
        },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "You must agree to the digital rental agreement",
      });
    });
  });

  describe("BK_UT_005 - Verify unavailable dress validation", () => {
    test("should return 400 if dress is not available", async () => {
      Dress.findById.mockResolvedValue({ _id: "dress1", available: false });

      const req = {
        body: {
          dressId: "dress1",
          startDate: "2026-04-10",
          endDate: "2026-04-12",
          address: "Street 1",
          city: "Kathmandu",
          phone: "1234567890",
          deliveryMethod: "pickup",
          agreedToTerms: true,
          agreedToDigitalAgreement: true,
        },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Dress not available",
      });
    });
  });

  describe("BK_UT_006 - Verify successful booking creation with new fields", () => {
    test("should create booking successfully with delivery and agreement fields", async () => {
      Dress.findById.mockResolvedValue({ _id: "dress1", available: true });

      const mockBooking = {
        _id: "booking1",
        renter: "user1",
        dress: "dress1",
        status: "pending",
        deliveryMethod: "delivery",
        deliveryFee: 100,
        agreedToTerms: true,
        agreedToDigitalAgreement: true,
      };

      Booking.create.mockResolvedValue(mockBooking);

      const req = {
        body: {
          dressId: "dress1",
          startDate: "2026-04-10",
          endDate: "2026-04-12",
          address: "Street 1",
          city: "Kathmandu",
          phone: "1234567890",
          totalAmount: 5100,
          securityDeposit: 1000,
          deliveryMethod: "delivery",
          deliveryFee: 100,
          agreedToTerms: true,
          agreedToDigitalAgreement: true,
          refundDetails: {
            preferredMethod: "bank",
            bankDetails: {
              accountHolder: "Ali Khan",
              bankName: "Nabil Bank",
              accountNumber: "123456789",
              ifscCode: "NARBNPKA",
            },
            digitalWallet: {
              provider: "",
              phoneNumber: "",
              qrCode: "",
            },
          },
        },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await createBooking(req, res);

      expect(Booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          renter: "user1",
          dress: "dress1",
          deliveryMethod: "delivery",
          deliveryFee: 100,
          agreedToTerms: true,
          agreedToDigitalAgreement: true,
          agreementAcceptedAt: expect.any(Date),
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Booking request sent to owner. Awaiting confirmation.",
        booking: mockBooking,
      });
    });
  });

  describe("BK_UT_007 - Verify booking confirmation", () => {
    test("should confirm booking and set dress unavailable", async () => {
      const bookingSave = jest.fn().mockResolvedValue();
      const dressSave = jest.fn().mockResolvedValue();

      const mockBooking = {
        _id: "booking1",
        status: "pending",
        dress: {
          _id: "dress1",
          owner: { toString: () => "owner1" },
        },
        save: bookingSave,
      };

      Booking.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking),
      });

      Dress.findById.mockResolvedValue({
        _id: "dress1",
        available: true,
        save: dressSave,
      });

      const req = {
        params: { id: "booking1" },
        user: { _id: "owner1" },
      };
      const res = createMockRes();

      await confirmBooking(req, res);

      expect(mockBooking.status).toBe("confirmed");
      expect(bookingSave).toHaveBeenCalled();
      expect(dressSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Booking confirmed successfully",
        booking: mockBooking,
      });
    });
  });

  describe("BK_UT_008 - Verify refund processing", () => {
    test("should process refund successfully", async () => {
      const bookingSave = jest.fn().mockResolvedValue();

      const mockBooking = {
        _id: "booking1",
        dress: "dress1",
        status: "returned",
        refundStatus: "pending",
        securityDeposit: 1000,
        refundDetails: { preferredMethod: "bank" },
        save: bookingSave,
      };

      Booking.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking),
      });

      Dress.findById.mockResolvedValue({
        _id: "dress1",
        owner: { toString: () => "owner1" },
      });

      const req = {
        params: { id: "booking1" },
        user: { _id: "owner1" },
      };
      const res = createMockRes();

      await processRefund(req, res);

      expect(bookingSave).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Refund processed successfully",
          booking: mockBooking,
          refundDetails: expect.objectContaining({
            amount: 1000,
            method: "bank",
          }),
        })
      );
    });
  });

  describe("BK_UT_009 - Verify booking deletion", () => {
    test("should delete cancelled booking successfully", async () => {
      const deleteOneMock = jest.fn().mockResolvedValue();

      Booking.findById.mockResolvedValue({
        _id: "booking1",
        renter: { toString: () => "user1" },
        status: "cancelled",
        deleteOne: deleteOneMock,
      });

      const req = {
        params: { id: "booking1" },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await deleteBooking(req, res);

      expect(deleteOneMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Booking deleted successfully",
      });
    });
  });
});