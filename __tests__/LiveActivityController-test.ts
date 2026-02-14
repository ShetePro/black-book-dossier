import { LiveActivity } from "../utils/LiveActivityController";

// Mock implementations - must be defined before jest.mock
const mockStartLiveActivity = jest.fn();
const mockUpdateLiveActivity = jest.fn();
const mockStopLiveActivity = jest.fn();

jest.mock("../modules/activity-controller", () => ({
  startLiveActivity: (...args: any[]) => mockStartLiveActivity(...args),
  updateLiveActivity: (...args: any[]) => mockUpdateLiveActivity(...args),
  stopLiveActivity: (...args: any[]) => mockStopLiveActivity(...args),
}));

describe("LiveActivity Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("start", () => {
    it("should call startLiveActivity and log success", async () => {
      mockStartLiveActivity.mockResolvedValue(undefined);

      await LiveActivity.start();

      expect(mockStartLiveActivity).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith("JS: 请求启动灵动岛");
    });

    it("should handle errors and log failure", async () => {
      mockStartLiveActivity.mockImplementation(() => {
        throw new Error("Start failed");
      });

      await LiveActivity.start();

      expect(mockStartLiveActivity).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        "JS: 启动灵动岛失败",
        expect.any(Error),
      );
    });
  });

  describe("update", () => {
    it("should call updateLiveActivity with correct parameters", async () => {
      mockUpdateLiveActivity.mockResolvedValue(undefined);

      const params = {
        distance: 3.5,
        duration: "00:25:30",
        pace: "07:17",
      };

      await LiveActivity.update(params);

      expect(mockUpdateLiveActivity).toHaveBeenCalledWith(params);
    });

    it("should handle errors silently", async () => {
      mockUpdateLiveActivity.mockImplementation(() => {
        throw new Error("Update failed");
      });

      const params = {
        distance: 3.5,
        duration: "00:25:30",
        pace: "07:17",
      };

      // Should not throw, just resolve
      await expect(LiveActivity.update(params)).resolves.toBeUndefined();
    });
  });

  describe("stop", () => {
    it("should call stopLiveActivity and log success", async () => {
      mockStopLiveActivity.mockResolvedValue(undefined);

      await LiveActivity.stop();

      expect(mockStopLiveActivity).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith("JS: 请求关闭灵动岛");
    });

    it("should handle errors and log failure", async () => {
      mockStopLiveActivity.mockImplementation(() => {
        throw new Error("Stop failed");
      });

      await LiveActivity.stop();

      expect(mockStopLiveActivity).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        "JS: 关闭灵动岛失败",
        expect.any(Error),
      );
    });
  });

  describe("integration workflow", () => {
    it("should handle complete running session", async () => {
      mockStartLiveActivity.mockResolvedValue(undefined);
      mockUpdateLiveActivity.mockResolvedValue(undefined);
      mockStopLiveActivity.mockResolvedValue(undefined);

      // Start running
      await LiveActivity.start();
      expect(mockStartLiveActivity).toHaveBeenCalledTimes(1);

      // Update multiple times (simulating GPS updates)
      const updates = [
        { distance: 0.5, duration: "00:05:00", pace: "10:00" },
        { distance: 1.0, duration: "00:09:30", pace: "09:30" },
        { distance: 1.5, duration: "00:14:15", pace: "09:30" },
      ];

      for (const update of updates) {
        await LiveActivity.update(update);
      }
      expect(mockUpdateLiveActivity).toHaveBeenCalledTimes(3);

      // Stop running
      await LiveActivity.stop();
      expect(mockStopLiveActivity).toHaveBeenCalledTimes(1);
    });
  });
});
