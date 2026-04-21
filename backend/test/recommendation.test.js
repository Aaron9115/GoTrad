// backend/test/recommendation.test.js

const axios = require("axios");
const Dress = require("../models/Dress");
const { recommendBySkinTone } = require("../controllers/recommendController");

jest.mock("axios");
jest.mock("../models/Dress");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("recommendBySkinTone Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("REC_TC_001 - Verify image validation", () => {
    test("should return 400 if no image is uploaded", async () => {
      const req = {
        file: null,
        query: {},
      };
      const res = createMockRes();

      await recommendBySkinTone(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Image required",
      });
    });
  });

  describe("REC_TC_002 - Verify successful skin tone recommendation", () => {
    test("should detect skin tone and return recommended dresses", async () => {
      const req = {
        file: {
          buffer: Buffer.from("fake-image"),
        },
        query: {},
      };
      const res = createMockRes();

      axios.post.mockResolvedValue({
        data: { skin_tone: "Medium" },
      });

      const mockDresses = [
        {
          name: "Red Wedding Gown",
          color: "Red",
          category: "Wedding",
          price: 49.99,
        },
        {
          name: "Blue Party Dress",
          color: "Blue",
          category: "Party",
          price: 89.99,
        },
      ];

      const limitMock = jest.fn().mockResolvedValue(mockDresses);
      Dress.find.mockReturnValue({ limit: limitMock });

      await recommendBySkinTone(req, res);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        "http://127.0.0.1:5001/predict-skin-tone",
        expect.any(Object),
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );

      expect(Dress.find).toHaveBeenCalledTimes(1);
      expect(limitMock).toHaveBeenCalledWith(12);

      expect(res.json).toHaveBeenCalledWith({
        skinTone: "Medium",
        recommendedColors: [
          "Red",
          "Maroon",
          "Orange",
          "Yellow",
          "Green",
          "Blue",
          "Gold",
        ],
        dresses: mockDresses,
      });
    });
  });

  describe("REC_TC_003 - Verify category filtering", () => {
    test("should apply category filter when category is provided", async () => {
      const req = {
        file: {
          buffer: Buffer.from("fake-image"),
        },
        query: {
          category: "Wedding",
        },
      };
      const res = createMockRes();

      axios.post.mockResolvedValue({
        data: { skin_tone: "Light" },
      });

      const mockDresses = [
        {
          name: "Red Wedding Gown",
          color: "Red",
          category: "Wedding",
          price: 49.99,
        },
      ];

      const limitMock = jest.fn().mockResolvedValue(mockDresses);
      Dress.find.mockReturnValue({ limit: limitMock });

      await recommendBySkinTone(req, res);

      expect(Dress.find).toHaveBeenCalledTimes(1);

      const queryPassed = Dress.find.mock.calls[0][0];

      expect(queryPassed.available).toBe(true);
      expect(queryPassed.$or).toHaveLength(7);
      expect(queryPassed.category.$regex).toBeInstanceOf(RegExp);
      expect(queryPassed.category.$regex.test("Wedding")).toBe(true);
      expect(queryPassed.category.$regex.test("wedding")).toBe(true);

      expect(res.json).toHaveBeenCalledWith({
        skinTone: "Light",
        recommendedColors: [
          "Red",
          "Maroon",
          "Pink",
          "Purple",
          "Blue",
          "Green",
          "Gold",
        ],
        dresses: mockDresses,
      });
    });

    test("should not apply category filter when category is all", async () => {
      const req = {
        file: {
          buffer: Buffer.from("fake-image"),
        },
        query: {
          category: "all",
        },
      };
      const res = createMockRes();

      axios.post.mockResolvedValue({
        data: { skin_tone: "Dark" },
      });

      const mockDresses = [
        {
          name: "Blue Dress",
          color: "Blue",
          category: "Party",
          price: 59.99,
        },
      ];

      const limitMock = jest.fn().mockResolvedValue(mockDresses);
      Dress.find.mockReturnValue({ limit: limitMock });

      await recommendBySkinTone(req, res);

      const queryPassed = Dress.find.mock.calls[0][0];

      expect(queryPassed.available).toBe(true);
      expect(queryPassed.$or).toHaveLength(7);
      expect(queryPassed.category).toBeUndefined();

      expect(res.json).toHaveBeenCalledWith({
        skinTone: "Dark",
        recommendedColors: [
          "Red",
          "Maroon",
          "Purple",
          "Blue",
          "Green",
          "Gold",
          "Silver",
        ],
        dresses: mockDresses,
      });
    });
  });

  describe("REC_TC_004 - Verify default color fallback", () => {
    test("should return default colors if skin tone is unknown", async () => {
      const req = {
        file: {
          buffer: Buffer.from("fake-image"),
        },
        query: {},
      };
      const res = createMockRes();

      axios.post.mockResolvedValue({
        data: { skin_tone: "Unknown" },
      });

      const mockDresses = [
        {
          name: "Green Dress",
          color: "Green",
          category: "Casual",
          price: 39.99,
        },
      ];

      const limitMock = jest.fn().mockResolvedValue(mockDresses);
      Dress.find.mockReturnValue({ limit: limitMock });

      await recommendBySkinTone(req, res);

      expect(res.json).toHaveBeenCalledWith({
        skinTone: "Unknown",
        recommendedColors: ["Red", "Maroon", "Green", "Blue", "Gold"],
        dresses: mockDresses,
      });
    });
  });

  describe("REC_TC_005 - Verify Flask API connection error handling", () => {
    test("should return 503 if Flask server is not running", async () => {
      const req = {
        file: {
          buffer: Buffer.from("fake-image"),
        },
        query: {},
      };
      const res = createMockRes();

      const error = new Error("Connection refused");
      error.code = "ECONNREFUSED";

      axios.post.mockRejectedValue(error);

      await recommendBySkinTone(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        message: "Flask AI server is not running. Please start it on port 5001.",
      });
    });
  });

  describe("REC_TC_006 - Verify generic error handling", () => {
    test("should return 500 for other errors", async () => {
      const req = {
        file: {
          buffer: Buffer.from("fake-image"),
        },
        query: {},
      };
      const res = createMockRes();

      const error = new Error("Something went wrong");
      axios.post.mockRejectedValue(error);

      await recommendBySkinTone(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Recommendation failed: Something went wrong",
      });
    });
  });
});