import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import {
  WebSearchSkill,
  search,
  initialize,
  getQuota,
  type SearchQuery,
  type WebSearchResponse,
} from './index.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('WebSearchSkill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset axios.create mock
    mockedAxios.create = vi.fn().mockReturnValue({
      get: vi.fn(),
      post: vi.fn(),
    } as any);
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', async () => {
      const skill = new WebSearchSkill({
        braveApiKey: 'test-key',
        enableRateLimit: true,
      });

      const mockResponse = {
        data: {
          web: {
            results: [
              {
                title: 'Test Result',
                url: 'https://example.com',
                description: 'Test description',
              },
            ],
          },
        },
      };

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.get as any).mockResolvedValue(mockResponse);
      (skill as any).httpClient = mockHttpClient;

      // Should succeed
      const result = await skill.search({ query: 'test' });
      expect(result.results).toHaveLength(1);
    });

    it('should throw error when rate limit exceeded', async () => {
      const skill = new WebSearchSkill({
        braveApiKey: 'test-key',
        enableRateLimit: true,
      });

      const mockResponse = {
        data: {
          web: {
            results: [{ title: 'Test', url: 'https://example.com', description: 'Test' }],
          },
        },
      };

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.get as any).mockResolvedValue(mockResponse);
      (skill as any).httpClient = mockHttpClient;

      // Exhaust rate limit
      for (let i = 0; i < 100; i++) {
        (skill as any).rateLimiter.recordRequest();
      }

      // Should throw rate limit error
      await expect(skill.search({ query: 'test' })).rejects.toThrow('Rate limit exceeded');
    });

    it('should bypass rate limit when disabled', async () => {
      const skill = new WebSearchSkill({
        braveApiKey: 'test-key',
        enableRateLimit: false,
      });

      const mockResponse = {
        data: {
          web: {
            results: [{ title: 'Test', url: 'https://example.com', description: 'Test' }],
          },
        },
      };

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.get as any).mockResolvedValue(mockResponse);
      (skill as any).httpClient = mockHttpClient;

      // Exhaust would-be rate limit
      for (let i = 0; i < 100; i++) {
        (skill as any).rateLimiter.recordRequest();
      }

      // Should still succeed with rate limiting disabled
      const result = await skill.search({ query: 'test' });
      expect(result.results).toHaveLength(1);
    });
  });

  describe('Brave Search', () => {
    it('should search using Brave API', async () => {
      const skill = new WebSearchSkill({
        braveApiKey: 'test-brave-key',
      });

      const mockResponse = {
        data: {
          web: {
            results: [
              {
                title: 'TypeScript Documentation',
                url: 'https://www.typescriptlang.org/',
                description: 'TypeScript is a typed superset of JavaScript',
                age: '2024-01-15',
                language: 'en',
                family_friendly: true,
              },
              {
                title: 'TypeScript GitHub',
                url: 'https://github.com/microsoft/TypeScript',
                description: 'TypeScript is a superset of JavaScript',
                age: '2024-01-10',
                language: 'en',
                family_friendly: true,
              },
            ],
          },
        },
      };

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.get as any).mockResolvedValue(mockResponse);
      (skill as any).httpClient = mockHttpClient;

      const result = await skill.search({ query: 'TypeScript' });

      expect(result.provider).toBe('brave');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].title).toBe('TypeScript Documentation');
      expect(result.results[0].url).toBe('https://www.typescriptlang.org/');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);

      // Verify API call
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'https://api.search.brave.com/res/v1/web/search',
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'TypeScript',
          }),
          headers: expect.objectContaining({
            'X-Subscription-Token': 'test-brave-key',
          }),
        })
      );
    });

    it('should handle empty Brave results', async () => {
      const skill = new WebSearchSkill({
        braveApiKey: 'test-brave-key',
      });

      const mockResponse = {
        data: {
          web: {},
        },
      };

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.get as any).mockResolvedValue(mockResponse);
      (skill as any).httpClient = mockHttpClient;

      const result = await skill.search({ query: 'test' });

      expect(result.results).toHaveLength(0);
    });

    it('should clean HTML from Brave results', async () => {
      const skill = new WebSearchSkill({
        braveApiKey: 'test-brave-key',
      });

      const mockResponse = {
        data: {
          web: {
            results: [
              {
                title: '<b>Bold Title</b>',
                url: 'https://example.com',
                description: '<em>Italic</em> description with <a href="#">link</a>',
              },
            ],
          },
        },
      };

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.get as any).mockResolvedValue(mockResponse);
      (skill as any).httpClient = mockHttpClient;

      const result = await skill.search({ query: 'test' });

      expect(result.results[0].title).toBe('Bold Title');
      expect(result.results[0].description).toBe('Italic description with link');
    });
  });

  describe('Serper Search', () => {
    it('should fallback to Serper when Brave fails', async () => {
      const skill = new WebSearchSkill({
        braveApiKey: 'test-brave-key',
        serperApiKey: 'test-serper-key',
      });

      const mockHttpClient = mockedAxios.create();

      // Brave fails
      (mockHttpClient.get as any).mockRejectedValue(new Error('Brave API error'));

      // Serper succeeds
      (mockHttpClient.post as any).mockResolvedValue({
        data: {
          organic: [
            {
              title: 'Result from Serper',
              link: 'https://serper-result.com',
              snippet: 'This is from Serper',
              position: 1,
            },
          ],
        },
      });

      (skill as any).httpClient = mockHttpClient;

      const result = await skill.search({ query: 'test' });

      expect(result.provider).toBe('serper');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Result from Serper');
      expect(result.results[0].url).toBe('https://serper-result.com');
    });

    it('should use Serper when Brave key not provided', async () => {
      const skill = new WebSearchSkill({
        serperApiKey: 'test-serper-key',
      });

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.post as any).mockResolvedValue({
        data: {
          organic: [
            {
              title: 'Serper Result',
              link: 'https://example.com',
              snippet: 'Description',
              position: 1,
            },
          ],
        },
      });

      (skill as any).httpClient = mockHttpClient;

      const result = await skill.search({ query: 'test' });

      expect(result.provider).toBe('serper');
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://google.serper.dev/search',
        expect.objectContaining({
          q: 'test',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-KEY': 'test-serper-key',
          }),
        })
      );
    });
  });

  describe('Configuration', () => {
    it('should use custom max results', async () => {
      const skill = new WebSearchSkill({
        braveApiKey: 'test-key',
        maxResults: 20,
      });

      const mockResponse = {
        data: { web: { results: [] } },
      };

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.get as any).mockResolvedValue(mockResponse);
      (skill as any).httpClient = mockHttpClient;

      await skill.search({ query: 'test' });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            count: 20,
          }),
        })
      );
    });

    it('should support country and language parameters', async () => {
      const skill = new WebSearchSkill({
        braveApiKey: 'test-key',
      });

      const mockResponse = {
        data: { web: { results: [] } },
      };

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.get as any).mockResolvedValue(mockResponse);
      (skill as any).httpClient = mockHttpClient;

      await skill.search({
        query: 'test',
        country: 'fr',
        language: 'fr',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            country: 'fr',
            lang: 'fr',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error when query is empty', async () => {
      const skill = new WebSearchSkill({
        braveApiKey: 'test-key',
      });

      await expect(skill.search({ query: '' })).rejects.toThrow('Search query cannot be empty');
    });

    it('should throw error when no API keys configured', async () => {
      const skill = new WebSearchSkill({});

      await expect(skill.search({ query: 'test' })).rejects.toThrow(
        'No search API keys configured'
      );
    });

    it('should throw error when all providers fail', async () => {
      const skill = new WebSearchSkill({
        braveApiKey: 'test-brave-key',
        serperApiKey: 'test-serper-key',
      });

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.get as any).mockRejectedValue(new Error('Brave failed'));
      (mockHttpClient.post as any).mockRejectedValue(new Error('Serper failed'));
      (skill as any).httpClient = mockHttpClient;

      await expect(skill.search({ query: 'test' })).rejects.toThrow('All search providers failed');
    });
  });

  describe('Exported Functions', () => {
    beforeEach(() => {
      // Reset module state
      initialize({ braveApiKey: 'test-key' });
    });

    it('should search with string query', async () => {
      const mockResponse = {
        data: {
          web: {
            results: [
              {
                title: 'Test',
                url: 'https://example.com',
                description: 'Test description',
              },
            ],
          },
        },
      };

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.get as any).mockResolvedValue(mockResponse);

      // Patch the instance's httpClient
      const mockCreate = vi.fn().mockReturnValue(mockHttpClient);
      mockedAxios.create = mockCreate;
      initialize({ braveApiKey: 'test-key' });

      const result = await search('test query');

      expect(result.results).toHaveLength(1);
      expect(result.query).toBe('test query');
    });

    it('should search with SearchQuery object', async () => {
      const mockResponse = {
        data: {
          web: {
            results: [
              {
                title: 'Test',
                url: 'https://example.com',
                description: 'Test description',
              },
            ],
          },
        },
      };

      const mockHttpClient = mockedAxios.create();
      (mockHttpClient.get as any).mockResolvedValue(mockResponse);

      const mockCreate = vi.fn().mockReturnValue(mockHttpClient);
      mockedAxios.create = mockCreate;
      initialize({ braveApiKey: 'test-key' });

      const result = await search({
        query: 'test query',
        maxResults: 5,
      });

      expect(result.results).toHaveLength(1);
    });

    it('should get remaining quota', () => {
      initialize({ braveApiKey: 'test-key' });

      const quota = getQuota();
      expect(quota).toBe(100); // Full quota
    });
  });
});
