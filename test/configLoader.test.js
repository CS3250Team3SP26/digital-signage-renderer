import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { loadConfig, validateConfig, validateLayout, validateComponents, validateComponent } from '../src/renderer.js';

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
            json: jest.fn().mockResolvedValue({
                layout: { zones: ["main"] },
                components: [{ zone: "main", type: "image", src: "./img.png", alt: "test" }]
            })
        })

        // Act - call the function
        const config = await loadConfig(["main"]);
        
        // Assert - check the result
        expect(config.layout).toEqual({ zones: ["main"] });
        expect(config.components).toEqual([{ zone: "main", type: "image", src: "./img.png", alt: "test" }]);
    });

    it('should throw when response is not ok', async () => {
        globalThis.fetch.mockResolvedValue({
            ok: false,
            status: 404
        })
        await expect(loadConfig(["main"])).rejects.toThrow(`HTTP error! status: 404`);
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

    it(`should throw when thre are missing required fields`, () => {
        const config = {
            layout: {
                zones: ["header"]
            }
        }
        expect(() => validateConfig(config, validZones)).toThrow("Missing required field: components");
    });
});

describe('validateLayout', () => {

    const validZones = ["header"];

    it('should return no errors when layout is valid', () => {
        expect(validateLayout({ zones: ["header"] }, validZones)).toEqual([]);
    });

    it('should return an error when there is no layout field', () => {
        expect(validateLayout(undefined, validZones)).toContain("Missing required field: layout");
    });

    it('should return an error when there is no layout.zones field', () => {
        expect(validateLayout({}, validZones)).toContain("layout.zones must be a non-empty array");
    });

    it('should return an error when layout.zones field is empty', () => {
        expect(validateLayout({ zones: [] }, validZones)).toContain("layout.zones must be a non-empty array");
    });

    it('should return an error when zones contains an invalid zone', () => {
        expect(validateLayout({ zones: ["footer"] }, validZones)).toContain("Invalid zones: footer");
    });
});

describe('validateComponents', () => {

    const validZones = ["header"];

    it('should return no errors when components are valid', () => {
        const components = [{ type: "rss", zone: "header", url: "https//AFakeURL" }];
        expect(validateComponents(components, validZones)).toEqual([]);
    });

    it('should return an error when there is no components field', () => {
        expect(validateComponents(undefined, validZones)).toContain("Missing required field: components");
    });

    it('should return an error when components is empty', () => {
        expect(validateComponents([], validZones)).toContain("components must be a non-empty array");
    });

    it('should return an error when components is not an array', () => {
        expect(validateComponents({}, validZones)).toContain("components must be a non-empty array");
    });
});

describe('validateComponent', () => {

    const validZones = ["header"];

    it('should return no errors when component is valid', () => {
        expect(validateComponent({ type: "rss", zone: "header", url: "https//AFakeURL" }, validZones)).toEqual([]);
    });

    it('should return an error when a component is missing a type field', () => {
        expect(validateComponent({ zone: "header", url: "https//AFakeURL" }, validZones)).toContain("Each component must have a type field");
    });

    it('should return an error when a component has an unknown type', () => {
        expect(validateComponent({ type: "Peanuts", zone: "header", url: "https//AFakeURL" }, validZones)).toContain("Unknown component type: Peanuts");
    });

    it('should return an error when a component is missing a required field for that type', () => {
        expect(validateComponent({ type: "rss", zone: "header" }, validZones)).toContain("Component of type rss is missing required fields: url");
    });

    it('should return an error when a component is missing a zone field', () => {
        expect(validateComponent({ type: "rss", url: "https//AFakeURL" }, validZones)).toContain("Each component must have a zone field");
    });

    it('should return an error when a component has an invalid zone', () => {
        expect(validateComponent({ type: "rss", zone: "footer", url: "https//AFakeURL" }, validZones)).toContain("Each component must have a valid zone: footer is an invalid zone");
    });
});
        