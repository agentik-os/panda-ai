/**
 * Weather API Skill
 */

import axios from "axios";
import { SkillBase } from "../../../packages/sdk/src/index.js";

export interface WeatherConfig extends Record<string, unknown> {
  apiKey: string;
  units?: "metric" | "imperial" | "standard";
}

export interface WeatherInput {
  action: "getCurrent" | "getForecast" | "getAlerts";
  params: Record<string, any>;
  [key: string]: unknown;
}

export interface WeatherOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class WeatherSkill extends SkillBase<WeatherInput, WeatherOutput> {
  readonly id = "weather";
  readonly name = "Weather API";
  readonly version = "1.0.0";
  readonly description = "Get weather forecasts and current conditions";

  protected config: WeatherConfig;
  private baseUrl = "https://api.openweathermap.org/data/2.5";

  constructor(config: WeatherConfig) {
    super();
    this.config = config;
  }

  async execute(input: WeatherInput): Promise<WeatherOutput> {
    try {
      switch (input.action) {
        case "getCurrent": {
          const current = await axios.get(`${this.baseUrl}/weather`, {
            params: {
              q: input.params.city,
              lat: input.params.lat,
              lon: input.params.lon,
              appid: this.config.apiKey,
              units: this.config.units || "metric",
            },
          });
          return { success: true, data: current.data };
        }

        case "getForecast": {
          const forecast = await axios.get(`${this.baseUrl}/forecast`, {
            params: {
              q: input.params.city,
              lat: input.params.lat,
              lon: input.params.lon,
              appid: this.config.apiKey,
              units: this.config.units || "metric",
              cnt: input.params.days || 5,
            },
          });
          return { success: true, data: forecast.data };
        }

        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async validate(input: WeatherInput): Promise<boolean> {
    return !!input?.action && !!input?.params;
  }
}

export function createWeatherSkill(config: WeatherConfig): WeatherSkill {
  return new WeatherSkill(config);
}
