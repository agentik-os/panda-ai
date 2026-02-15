/**
 * Weather Skill Comprehensive Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { WeatherSkill } from "../src/index.js";
import axios from "axios";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

describe("WeatherSkill", () => {
  let skill: WeatherSkill;
  const mockConfig = {
    apiKey: "test-api-key",
    units: "metric",
  };

  beforeEach(() => {
    skill = new WeatherSkill(mockConfig);
    vi.clearAllMocks();
  });

  describe("Metadata", () => {
    it("should have correct id", () => {
      expect(skill.id).toBe("weather");
    });

    it("should have correct name", () => {
      expect(skill.name).toBe("Weather API");
    });

    it("should have correct version", () => {
      expect(skill.version).toBe("1.0.0");
    });

    it("should have description", () => {
      expect(skill.description).toContain("Weather");
      expect(skill.description).toContain("OpenWeatherMap");
    });
  });

  describe("validate()", () => {
    it("should reject missing action", async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it("should reject missing params", async () => {
      expect(await skill.validate({ action: "getCurrent" } as any)).toBe(
        false
      );
    });

    it("should accept valid getCurrent input", async () => {
      expect(
        await skill.validate({
          action: "getCurrent",
          params: { location: "London" },
        })
      ).toBe(true);
    });

    it("should accept valid getForecast input", async () => {
      expect(
        await skill.validate({
          action: "getForecast",
          params: { location: "Paris" },
        })
      ).toBe(true);
    });
  });

  describe("execute() - getCurrent", () => {
    it("should get current weather successfully", async () => {
      const mockResponse = {
        data: {
          weather: [{ main: "Clear", description: "clear sky" }],
          main: { temp: 20, feels_like: 19, humidity: 60 },
          wind: { speed: 5 },
          name: "London",
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await skill.execute({
        action: "getCurrent",
        params: {
          location: "London",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("weather"),
        expect.objectContaining({
          params: {
            q: "London",
            appid: "test-api-key",
            units: "metric",
          },
        })
      );
    });

    it("should handle location not found errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("city not found"));

      const result = await skill.execute({
        action: "getCurrent",
        params: {
          location: "InvalidCity123",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("city not found");
    });

    it("should handle API key errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Invalid API key"));

      const result = await skill.execute({
        action: "getCurrent",
        params: { location: "London" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid API key");
    });
  });

  describe("execute() - getForecast", () => {
    it("should get forecast successfully", async () => {
      const mockResponse = {
        data: {
          list: [
            {
              dt: 1609459200,
              main: { temp: 15, humidity: 70 },
              weather: [{ main: "Clouds" }],
            },
            {
              dt: 1609545600,
              main: { temp: 18, humidity: 65 },
              weather: [{ main: "Rain" }],
            },
          ],
          city: { name: "Paris" },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await skill.execute({
        action: "getForecast",
        params: {
          location: "Paris",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("forecast"),
        expect.objectContaining({
          params: {
            q: "Paris",
            appid: "test-api-key",
            units: "metric",
          },
        })
      );
    });

    it("should handle forecast errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Service unavailable"));

      const result = await skill.execute({
        action: "getForecast",
        params: { location: "Tokyo" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Service unavailable");
    });

    it("should handle network errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));

      const result = await skill.execute({
        action: "getForecast",
        params: { location: "New York" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("Error Handling", () => {
    it("should return error for unknown action", async () => {
      const result = await skill.execute({
        action: "invalidAction" as any,
        params: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown action");
      expect(result.error).toContain("invalidAction");
    });

    it("should handle non-Error exceptions", async () => {
      mockedAxios.get.mockRejectedValue("String error");

      const result = await skill.execute({
        action: "getCurrent",
        params: { location: "London" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });

    it("should handle 401 authentication errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("401 Unauthorized"));

      const result = await skill.execute({
        action: "getCurrent",
        params: { location: "London" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("401");
    });

    it("should handle 404 city not found errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("404 Not Found"));

      const result = await skill.execute({
        action: "getCurrent",
        params: { location: "InvalidCity" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("404");
    });
  });

  describe("Configuration", () => {
    it("should use provided API key", () => {
      const customSkill = new WeatherSkill({
        apiKey: "custom-api-key",
      });

      expect((customSkill as any).config.apiKey).toBe("custom-api-key");
    });

    it("should use custom units when provided", () => {
      const imperialSkill = new WeatherSkill({
        apiKey: "test-key",
        units: "imperial",
      });

      expect((imperialSkill as any).config.units).toBe("imperial");
    });

    it("should default to metric units", () => {
      const defaultSkill = new WeatherSkill({
        apiKey: "test-key",
      });

      expect((defaultSkill as any).config.units).toBe("metric");
    });

    it("should use correct base URL", () => {
      expect((skill as any).baseUrl).toBe(
        "https://api.openweathermap.org/data/2.5"
      );
    });
  });

  describe("Factory Function", () => {
    it("should create skill instance via factory", async () => {
      const { createWeatherSkill } = await import("../src/index.js");
      const factorySkill = createWeatherSkill(mockConfig);

      expect(factorySkill).toBeInstanceOf(WeatherSkill);
      expect(factorySkill.id).toBe("weather");
    });
  });
});
