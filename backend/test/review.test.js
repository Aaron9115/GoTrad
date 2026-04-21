// backend/test/review.test.js

const Review = require("../models/Review");
const Dress = require("../models/Dress");
const {
  addReview,
  getDressRatingSummary,
  deleteReview,
} = require("../controllers/reviewController");

jest.mock("../models/Review");
jest.mock("../models/Dress");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Review Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("RV_UT_001 - Verify missing dressId or rating", () => {
    test("should return 400 if dressId or rating is missing", async () => {
      const req = {
        body: {
          dressId: "",
          rating: "",
          comment: "Nice dress",
        },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await addReview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Dress and rating are required",
      });
    });
  });

  describe("RV_UT_002 - Verify empty comment validation", () => {
    test("should return 400 if comment is empty", async () => {
      const req = {
        body: {
          dressId: "dress1",
          rating: 5,
          comment: "   ",
        },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await addReview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Please write a review",
      });
    });
  });

  describe("RV_UT_003 - Verify dress existence", () => {
    test("should return 404 if dress is not found", async () => {
      Dress.findById.mockResolvedValue(null);

      const req = {
        body: {
          dressId: "dress1",
          rating: 5,
          comment: "Nice dress",
        },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await addReview(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Dress not found",
      });
    });
  });

  describe("RV_UT_004 - Verify duplicate review prevention", () => {
    test("should return 400 if user already reviewed this dress", async () => {
      Dress.findById.mockResolvedValue({ _id: "dress1" });
      Review.findOne.mockResolvedValue({ _id: "review1" });

      const req = {
        body: {
          dressId: "dress1",
          rating: 4,
          comment: "Good dress",
        },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await addReview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "You have already reviewed this dress",
      });
    });
  });

  describe("RV_UT_005 - Verify successful review creation", () => {
    test("should create review successfully", async () => {
      Dress.findById.mockResolvedValue({ _id: "dress1" });
      Review.findOne.mockResolvedValue(null);
      Review.create.mockResolvedValue({ _id: "review1" });

      const populatedReview = {
        _id: "review1",
        dress: "dress1",
        user: { name: "Ali" },
        rating: 5,
        comment: "Excellent dress",
      };

      Review.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedReview),
      });

      const req = {
        body: {
          dressId: "dress1",
          rating: 5,
          comment: "Excellent dress",
        },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await addReview(req, res);

      expect(Review.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(populatedReview);
    });
  });

  describe("RV_UT_006 - Verify rating summary", () => {
    test("should return correct average rating and total reviews", async () => {
      Review.find.mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
      ]);

      const req = {
        params: { dressId: "dress1" },
      };
      const res = createMockRes();

      await getDressRatingSummary(req, res);

      expect(res.json).toHaveBeenCalledWith({
        averageRating: 4.0,
        totalReviews: 3,
      });
    });
  });

  describe("RV_UT_007 - Verify review deletion", () => {
    test("should delete review successfully for review owner", async () => {
      const deleteOneMock = jest.fn().mockResolvedValue();

      Review.findById.mockResolvedValue({
        _id: "review1",
        user: { toString: () => "user1" },
        deleteOne: deleteOneMock,
      });

      const req = {
        params: { id: "review1" },
        user: { _id: "user1" },
      };
      const res = createMockRes();

      await deleteReview(req, res);

      expect(deleteOneMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Review deleted successfully",
      });
    });
  });
});