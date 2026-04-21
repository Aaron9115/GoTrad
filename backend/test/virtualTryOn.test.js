// backend/test/virtualTryOn.test.js

const axios = require("axios");
const {
  processVirtualTryOn,
  checkServiceStatus,
} = require("../controllers/virtualTryOnController");

jest.mock("axios");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Virtual Try-On Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("VT_UT_001 - Verify image validation", () => {
    test("should return 400 if images are missing", async () => {
      const req = { files: null };
      const res = createMockRes();

      await processVirtualTryOn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Both person image and dress image are required",
      });
    });
  });

  describe("VT_UT_002 - Verify successful virtual try-on", () => {
    test("should process successfully when both images are provided", async () => {
      axios.post.mockResolvedValue({
        data: {
          result_image: "fake_result",
          success: true,
        },
      });

      const req = {
        files: {
          person_image: [
            {
              buffer: Buffer.from("fake-person"),
              originalname: "person.jpg",
              mimetype: "image/jpeg",
            },
          ],
          dress_image: [
            {
              buffer: Buffer.from("fake-dress"),
              originalname: "dress.jpg",
              mimetype: "image/jpeg",
            },
          ],
        },
      };

      const res = createMockRes();

      await processVirtualTryOn(req, res);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        message: "Virtual try-on processed successfully",
        result: {
          result_image: "fake_result",
          success: true,
        },
      });
    });
  });

  describe("VT_UT_003 - Verify ML service connection error", () => {
    test("should return 503 if Flask server is not running", async () => {
      const error = new Error("Connection refused");
      error.code = "ECONNREFUSED";
      axios.post.mockRejectedValue(error);

      const req = {
        files: {
          person_image: [
            {
              buffer: Buffer.from("fake-person"),
              originalname: "person.jpg",
              mimetype: "image/jpeg",
            },
          ],
          dress_image: [
            {
              buffer: Buffer.from("fake-dress"),
              originalname: "dress.jpg",
              mimetype: "image/jpeg",
            },
          ],
        },
      };

      const res = createMockRes();

      await processVirtualTryOn(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "ML service is not available. Please make sure the Flask server is running on port 5001.",
      });
    });
  });

  describe("VT_UT_004 - Verify ML service error response handling", () => {
    test("should return ML error status and details when ML service responds with error", async () => {
      axios.post.mockRejectedValue({
        response: {
          status: 500,
          data: {
            error: "ML processing failed",
            details: "Model crashed",
          },
        },
      });

      const req = {
        files: {
          person_image: [
            {
              buffer: Buffer.from("fake-person"),
              originalname: "person.jpg",
              mimetype: "image/jpeg",
            },
          ],
          dress_image: [
            {
              buffer: Buffer.from("fake-dress"),
              originalname: "dress.jpg",
              mimetype: "image/jpeg",
            },
          ],
        },
      };

      const res = createMockRes();

      await processVirtualTryOn(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "ML processing failed",
        details: {
          error: "ML processing failed",
          details: "Model crashed",
        },
      });
    });
  });

  describe("VT_UT_005 - Verify generic internal error handling", () => {
    test("should return 500 for unexpected errors", async () => {
      axios.post.mockRejectedValue(new Error("Something went wrong"));

      const req = {
        files: {
          person_image: [
            {
              buffer: Buffer.from("fake-person"),
              originalname: "person.jpg",
              mimetype: "image/jpeg",
            },
          ],
          dress_image: [
            {
              buffer: Buffer.from("fake-dress"),
              originalname: "dress.jpg",
              mimetype: "image/jpeg",
            },
          ],
        },
      };

      const res = createMockRes();

      await processVirtualTryOn(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to process virtual try-on",
        error: "Something went wrong",
      });
    });
  });

  describe("VT_UT_006 - Verify service status check", () => {
    test("should return available when ML service is running", async () => {
      axios.get.mockResolvedValue({
        data: { status: "healthy", port: 5001 },
      });

      const req = {};
      const res = createMockRes();

      await checkServiceStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        status: "available",
        ml_service: { status: "healthy", port: 5001 },
      });
    });

    test("should return unavailable when ML service is down", async () => {
      axios.get.mockRejectedValue(new Error("Connection refused"));

      const req = {};
      const res = createMockRes();

      await checkServiceStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        status: "unavailable",
        message: "ML service is not running",
        details: "Connection refused",
      });
    });
  });

  describe("VT_UT_007 - Verify empty uploaded file arrays", () => {
    test("should return 400 if image fields exist but contain no files", async () => {
      const req = {
        files: {
          person_image: [],
          dress_image: [],
        },
      };
      const res = createMockRes();

      await processVirtualTryOn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Both person image and dress image are required",
      });
    });
  });
});