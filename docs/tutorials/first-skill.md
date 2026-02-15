# Build Your First Skill

> **5-minute tutorial: Create a working skill from scratch**

Learn by building a simple "Weather Lookup" skill that your agents can use to get weather data.

---

## What You'll Build

By the end of this tutorial, you'll have:

- ✅ A working skill that gets weather data
- ✅ The skill installed on an agent
- ✅ An agent using your skill in conversation

**Time:** 5 minutes
**Difficulty:** Beginner
**Prerequisites:** Node.js 18+ or Bun installed

---

## Step 1: Project Setup (30 seconds)

Create a new directory and initialize:

```bash
mkdir weather-skill
cd weather-skill
npm init -y
npm install @agentik/sdk axios
```

---

## Step 2: Create the Skill (2 minutes)

Create `skill.ts`:

```typescript
import { Skill, SkillContext } from '@agentik/sdk';
import axios from 'axios';

export default class WeatherSkill extends Skill {
  // Skill metadata
  static id = 'skill_weather_lookup';
  static name = 'Weather Lookup';
  static description = 'Get current weather for any city';
  static category = 'productivity';
  static version = '1.0.0';

  // Permissions required
  static permissions = ['network.http.get'];

  // Configuration schema
  static configSchema = {
    apiKey: {
      type: 'string',
      description: 'OpenWeather API key',
      required: true,
    },
  };

  // Tool: Get current weather
  async getCurrentWeather(
    params: { city: string; units?: 'metric' | 'imperial' },
    context: SkillContext
  ) {
    // Get API key from config
    const apiKey = this.getConfig('apiKey');

    // Fetch weather data
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          q: params.city,
          units: params.units || 'metric',
          appid: apiKey,
        },
      }
    );

    const data = response.data;

    // Return formatted result
    return {
      city: data.name,
      country: data.sys.country,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      units: params.units || 'metric',
    };
  }
}
```

**What's happening:**

- **Skill class** extends `Skill` from SDK
- **Metadata** (id, name, description) describes the skill
- **Permissions** declares what the skill can do
- **Config schema** defines required configuration
- **Method** `getCurrentWeather` is the tool agents will call
- **Result** is a plain object agents can understand

---

## Step 3: Build & Package (30 seconds)

Create `package.json` script:

```json
{
  "name": "weather-skill",
  "version": "1.0.0",
  "main": "dist/skill.js",
  "scripts": {
    "build": "tsc",
    "package": "agentik skill package"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["skill.ts"]
}
```

Build:

```bash
npm run build
```

---

## Step 4: Test Locally (1 minute)

Create `test.ts`:

```typescript
import WeatherSkill from './dist/skill';

async function test() {
  const skill = new WeatherSkill({
    apiKey: 'YOUR_OPENWEATHER_API_KEY',
  });

  const result = await skill.getCurrentWeather(
    { city: 'Paris', units: 'metric' },
    {} as any
  );

  console.log(result);
}

test();
```

Run:

```bash
npx tsx test.ts
```

**Expected output:**

```json
{
  "city": "Paris",
  "country": "FR",
  "temperature": 18,
  "feelsLike": 17,
  "condition": "partly cloudy",
  "humidity": 65,
  "windSpeed": 4.5,
  "units": "metric"
}
```

✅ **Skill works!**

---

## Step 5: Deploy to Agent (1 minute)

### Option 1: Dashboard

1. Go to **Skills** → **Upload Skill**
2. Upload `dist/skill.js`
3. Click skill → **Install**
4. Select agent → **Configure**
5. Add API key → **Save**

### Option 2: CLI

```bash
# Upload skill
panda skill upload dist/skill.js

# Install on agent
panda skill install agent_abc123 skill_weather_lookup \
  --config '{"apiKey":"YOUR_API_KEY"}'
```

### Option 3: API

```typescript
import { Agentik } from '@agentik/sdk';

const agentik = new Agentik({ apiKey: process.env.AGENTIK_API_KEY });

// Upload skill
const skill = await agentik.skills.upload('./dist/skill.js');

// Install on agent
await agentik.agents.skills.install(agentId, {
  skillId: skill.id,
  config: {
    apiKey: 'YOUR_OPENWEATHER_API_KEY',
  },
});
```

---

## Step 6: Try It! (30 seconds)

Chat with your agent:

**You:** "What's the weather in Tokyo?"

**Agent:** "Let me check the weather for you."

[Calls your skill: `getCurrentWeather({ city: "Tokyo" })`]

**Agent:** "The current weather in Tokyo, Japan is 23°C (73°F) with clear skies. Humidity is at 55% with a light breeze of 3.2 m/s."

🎉 **Your skill is working!**

---

## Next Steps

Now that you've built your first skill, try:

### Add More Tools

```typescript
export default class WeatherSkill extends Skill {
  // Existing tool
  async getCurrentWeather(...) { ... }

  // New tool
  async getForecast(
    params: { city: string; days: number },
    context: SkillContext
  ) {
    const apiKey = this.getConfig('apiKey');

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast`,
      {
        params: {
          q: params.city,
          cnt: params.days * 8, // 8 forecasts per day
          appid: apiKey,
        },
      }
    );

    return response.data;
  }
}
```

### Add Error Handling

```typescript
async getCurrentWeather(params, context) {
  try {
    const apiKey = this.getConfig('apiKey');

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const response = await axios.get(...);

    if (response.data.cod === '404') {
      throw new Error(`City '${params.city}' not found`);
    }

    return { ... };
  } catch (error) {
    // Log error
    context.log.error('Weather fetch failed', { error });

    // Return error to agent
    return {
      error: true,
      message: error.message,
    };
  }
}
```

### Add Caching

```typescript
import { cache } from '@agentik/sdk';

export default class WeatherSkill extends Skill {
  @cache({ ttl: 300 }) // Cache for 5 minutes
  async getCurrentWeather(params, context) {
    // This result will be cached for 5 minutes
    const response = await axios.get(...);
    return response.data;
  }
}
```

### Publish to Marketplace

```bash
# Test skill
panda skill test

# Publish (requires approval)
panda skill publish \
  --readme README.md \
  --screenshots screenshot1.png screenshot2.png \
  --category productivity
```

---

## Full Example

Complete working example with error handling and caching:

```typescript
import { Skill, SkillContext, cache } from '@agentik/sdk';
import axios from 'axios';

export default class WeatherSkill extends Skill {
  static id = 'skill_weather_lookup';
  static name = 'Weather Lookup';
  static description = 'Get current weather and forecasts for any city';
  static category = 'productivity';
  static version = '1.0.0';
  static permissions = ['network.http.get'];

  static configSchema = {
    apiKey: {
      type: 'string',
      description: 'OpenWeather API key (get free at openweathermap.org)',
      required: true,
    },
    defaultUnits: {
      type: 'string',
      enum: ['metric', 'imperial'],
      description: 'Default temperature units',
      default: 'metric',
    },
  };

  @cache({ ttl: 300 })
  async getCurrentWeather(
    params: { city: string; units?: 'metric' | 'imperial' },
    context: SkillContext
  ) {
    try {
      const apiKey = this.getConfig('apiKey');
      const units = params.units || this.getConfig('defaultUnits');

      context.log.info('Fetching weather', { city: params.city, units });

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q: params.city,
            units,
            appid: apiKey,
          },
          timeout: 10000,
        }
      );

      const data = response.data;

      if (data.cod === '404') {
        return {
          error: true,
          message: `City '${params.city}' not found`,
        };
      }

      const result = {
        city: data.name,
        country: data.sys.country,
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        condition: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        units,
      };

      context.log.info('Weather fetched successfully', result);

      return result;
    } catch (error) {
      context.log.error('Weather fetch failed', { error });

      return {
        error: true,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  @cache({ ttl: 600 })
  async getForecast(
    params: { city: string; days: number; units?: 'metric' | 'imperial' },
    context: SkillContext
  ) {
    try {
      const apiKey = this.getConfig('apiKey');
      const units = params.units || this.getConfig('defaultUnits');
      const days = Math.min(params.days, 5); // Max 5 days

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast`,
        {
          params: {
            q: params.city,
            cnt: days * 8, // 8 forecasts per day (3-hour intervals)
            units,
            appid: apiKey,
          },
          timeout: 10000,
        }
      );

      const data = response.data;

      return {
        city: data.city.name,
        country: data.city.country,
        forecast: data.list.map((item: any) => ({
          time: item.dt,
          temperature: item.main.temp,
          condition: item.weather[0].description,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
        })),
      };
    } catch (error) {
      context.log.error('Forecast fetch failed', { error });

      return {
        error: true,
        message: error.response?.data?.message || error.message,
      };
    }
  }
}
```

---

## Troubleshooting

### "Permission denied: network.http.get"

**Solution:** Add permission to skill:

```typescript
static permissions = ['network.http.get'];
```

### "API key not configured"

**Solution:** Configure skill when installing:

```bash
panda skill install agent_abc123 skill_weather_lookup \
  --config '{"apiKey":"YOUR_API_KEY"}'
```

### "City not found"

**Solution:** Check city name spelling. Use full city name (e.g., "New York" not "NYC").

---

## Summary

You've learned:

- ✅ How to create a skill class
- ✅ How to define tools (methods)
- ✅ How to handle configuration
- ✅ How to add permissions
- ✅ How to test locally
- ✅ How to deploy to agents
- ✅ How to add error handling and caching

**Next Tutorials:**

1. [Create Custom OS Mode](./custom-os-mode.md)
2. [Multi-Agent Consensus](./multi-agent-consensus.md)
3. [Deploy to Kubernetes](./kubernetes-deployment.md)
4. [Telegram Bot Integration](./telegram-integration.md)

**Resources:**

- 📚 [Skill Development Guide](../guides/skills-marketplace.md)
- 🛠️ [Skill SDK Reference](../api/sdk.md)
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)

---

*Last updated: February 14, 2026*
*Agentik OS Tutorial Team*
