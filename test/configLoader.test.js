import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { loadConfig, validateConfig } from '../src/renderer.js';

describe('loadConfig', () => {

    beforeEach(() => {
        globalThis.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return a config object when fetch succeeds', async () => {
        // Arrange
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ layout: {}, components: [] })
        })

        // Act - call the function
        const config = await loadConfig();
        
        // Assert - check the result
        expect(config.layout).toEqual({});
        expect(config.components).toEqual([]);
    });

    it('should throw when response is not ok', async () => {
        globalThis.fetch.mockResolvedValue({
            ok: false,
            status: 404
        })
        await expect(loadConfig()).rejects.toThrow(`HTTP error! status: 404`);
    });

    it('should throw when JSON is invalid', async () => {
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockRejectedValue(new Error('unexpected token'))
        })
        await expect(loadConfig()).rejects.toThrow('config.json contains invalid JSON - check for syntax errors');
    });

});

describe('validateConfig', () => {

    const validZones = ["header"];

    it('should not throw when config is valid', () => {
        const config = {
            layout: {
                zones: ["header"]
            },
            components: [
                {
                    type: "rss",
                    zone: "header",
                    url: "https//AFakeURL"
                }
            ]
        }
        expect(() => validateConfig(config, validZones)).not.toThrow();
    });

    it(`should throw when there is no layout field`, () => {
        const config = {
            components: [
                {
                    type: "rss",
                    zone: "header",
                    url: "https//AFakeURL"
                }
            ]
        }
        expect(() => validateConfig(config, validZones)).toThrow("Missing required field: layout");
    });

    it(`should throw when there is no layout.zones field`, () => {
        const config = {
            layout: {},
            components: [
                {
                    type: "rss",
                    zone: "header",
                    url: "https//AFakeURL"
                }
            ]
        }
        expect(() => validateConfig(config, validZones)).toThrow("layout.zones must be a non-empty array");
    });

    it(`should throw when layout.zones field is empty`, () => {
        const config = {
            layout: {
                zones: []
            },
            components: [
                {
                    type: "rss",
                    zone: "header",
                    url: "https//AFakeURL"
                }
            ]
        }
        expect(() => validateConfig(config, validZones)).toThrow("layout.zones must be a non-empty array");
    });

    it(`should throw when zones contains an invalid zone`, () => {
        const config = {
            layout: {
                zones: ["footer"]
            },
            components: [
                {
                    type: "rss",
                    zone: "header",
                    url: "https//AFakeURL"
                }
            ]
        }
        expect(() => validateConfig(config, validZones)).toThrow("Invalid zones: footer");
    });

    it(`should throw when there is no components field`, () => {
        const config = {
            layout: {
                zones: ["header"]
            }
        }
        expect(() => validateConfig(config, validZones)).toThrow("Missing required field: components");
    });

    it(`should throw when components is empty`, () => {
        const config = {
            layout: {
                zones: ["header"]
            },
            components: []
        }
        expect(() => validateConfig(config, validZones)).toThrow("config.components must be a non-empty array");
    });

    it(`should throw when components is empty or when it is not an array`, () => {
        const config = {
            layout: {
                zones: ["header"]
            },
            components: {}
        }
        expect(() => validateConfig(config, validZones)).toThrow("config.components must be a non-empty array");
    });

    it(`should throw when a component is missing a type field`, () => {
        const config = {
            layout: {
                zones: ["header"]
            },
            components: [
                {
                    zone: "header",
                    url: "https//AFakeURL"
                }
            ]
        }
        expect(() => validateConfig(config, validZones)).toThrow("Each component must have a type field");
    });

    it(`should throw when a component has an undefined type`, () => {
        const config = {
            layout: {
                zones: ["header"]
            },
            components: [
                {
                    type: "Peanuts",
                    zone: "header",
                    url: "https//AFakeURL"
                }
            ]
        }
        expect(() => validateConfig(config, validZones)).toThrow("Unknown component type: Peanuts");
    });

    it(`should throw when a component is missing a required field for that type`, () => {
        const config = {
            layout: {
                zones: ["header"]
            },
            components: [
                {
                    type: "rss",
                    zone: "header",
                }
            ]
        }
        expect(() => validateConfig(config, validZones)).toThrow("Component of type rss is missing required fields: url");
    });

    it(`should throw when a component is missing a zone field`, () => {
        const config = {
            layout: {
                zones: ["header"]
            },
            components: [
                {
                    type: "rss",
                    url: "https//AFakeURL"
                }
            ]
        }
        expect(() => validateConfig(config, validZones)).toThrow("Each component must have a zone field");
    });

    it(`should throw when a component has an invalid zone`, () => {
        const config = {
            layout: {
                zones: ["header"]
            },
            components: [
                {
                    type: "rss",
                    zone: "footer",
                    url: "https//AFakeURL"
                }
            ]
        }
        expect(() => validateConfig(config, validZones)).toThrow("Each component must have a valid zone: footer is an invalid zone");
    });
});
        