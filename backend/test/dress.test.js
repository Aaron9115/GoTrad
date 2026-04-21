// backend/test/dress.test.js

const Dress = require("../models/Dress");
const {
  addDress,
  getDressById,
  updateDress,
  deleteDress,
  toggleAvailability,
} = require("../controllers/dressController");

jest.mock("../models/Dress");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Dress Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("DR_UT_001 - Verify missing required fields", () => {
    test("should return 400 if required dress fields are missing", async () => {
      const req = {
        body: {
          name: "",
          size: "",
          color: "",
          category: "",
          price: "",
        },
        user: { _id: "owner1" },
      };
      const res = createMockRes();

      await addDress(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Please provide name, size, color, category and price",
      });
    });
  });

  describe("DR_UT_002 - Verify successful dress creation", () => {
    test("should add dress successfully", async () => {
      const mockDress = {
        _id: "dress1",
        owner: "owner1",
        name: "Red Dress",
        size: "M",
        color: "Red",
        category: "Wedding",
        price: 5000,
        available: true,
      };

      Dress.create.mockResolvedValue(mockDress);

      const req = {
        body: {
          name: "Red Dress",
          size: "M",
          color: "Red",
          category: "Wedding",
          price: 5000,
        },
        user: { _id: "owner1" },
      };
      const res = createMockRes();

      await addDress(req, res);

      expect(Dress.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Dress added successfully",
        dress: mockDress,
      });
    });
  });

  describe("DR_UT_003 - Verify get dress by id not found", () => {
    test("should return 404 if dress is not found", async () => {
      Dress.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = {
        params: { id: "dress1" },
      };
      const res = createMockRes();

      await getDressById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Dress not found",
      });
    });
  });

  describe("DR_UT_004 - Verify unauthorized dress update", () => {
    test("should return 401 if non-owner tries to update dress", async () => {
      Dress.findById.mockResolvedValue({
        _id: "dress1",
        owner: { toString: () => "owner1" },
      });

      const req = {
        params: { id: "dress1" },
        body: { name: "Updated Dress" },
        user: { _id: "otherUser" },
      };
      const res = createMockRes();

      await updateDress(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not authorized to update this dress",
      });
    });
  });

  describe("DR_UT_005 - Verify successful dress update", () => {
    test("should update dress successfully for owner", async () => {
      const saveMock = jest.fn().mockResolvedValue({
        _id: "dress1",
        owner: "owner1",
        name: "Updated Dress",
        size: "L",
        color: "Blue",
        category: "Party",
        price: 7000,
        available: false,
      });

      const mockDress = {
        _id: "dress1",
        owner: { toString: () => "owner1" },
        name: "Old Dress",
        size: "M",
        color: "Red",
        category: "Wedding",
        price: 5000,
        image: "old.jpg",
        description: "old desc",
        available: true,
        save: saveMock,
      };

      Dress.findById.mockResolvedValue(mockDress);

      const req = {
        params: { id: "dress1" },
        body: {
          name: "Updated Dress",
          size: "L",
          color: "Blue",
          category: "Party",
          price: 7000,
          available: false,
        },
        user: { _id: "owner1" },
      };
      const res = createMockRes();

      await updateDress(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Dress updated successfully",
        dress: expect.objectContaining({
          name: "Updated Dress",
        }),
      });
    });
  });

  describe("DR_UT_006 - Verify successful dress deletion", () => {
    test("should delete dress successfully for owner", async () => {
      const deleteOneMock = jest.fn().mockResolvedValue();

      Dress.findById.mockResolvedValue({
        _id: "dress1",
        owner: { toString: () => "owner1" },
        deleteOne: deleteOneMock,
      });

      const req = {
        params: { id: "dress1" },
        user: { _id: "owner1" },
      };
      const res = createMockRes();

      await deleteDress(req, res);

      expect(deleteOneMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Dress deleted successfully",
      });
    });
  });

  describe("DR_UT_007 - Verify toggle availability", () => {
    test("should toggle dress availability successfully for owner", async () => {
      const saveMock = jest.fn().mockResolvedValue();

      const mockDress = {
        _id: "dress1",
        owner: { toString: () => "owner1" },
        available: true,
        save: saveMock,
      };

      Dress.findById.mockResolvedValue(mockDress);

      const req = {
        params: { id: "dress1" },
        user: { _id: "owner1" },
      };
      const res = createMockRes();

      await toggleAvailability(req, res);

      expect(mockDress.available).toBe(false);
      expect(saveMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Dress is now rented",
        available: false,
      });
    });
  });
});