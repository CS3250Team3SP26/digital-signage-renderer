import { jest, describe, it, expect } from '@jest/globals';
import { buildImage, buildClock, buildWeather, fetchWeatherData, parseRssFeed, buildText } from '../src/renderer.js';
import { buildImage, buildClock , buildWeather, buildText, fetchWeatherData} from '../src/renderer.js';


describe('buildImage', () => {

    it('should return a component-card wrapper div', () => {
        const component = { src: './assets/logo.png', alt: 'A logo' };
        const result = buildImage(component, 'component-0');
        expect(result.tagName).toBe('DIV');
        expect(result.classList.contains('component-card')).toBe(true);
    });

    it('should stamp data-component-id on the card', () => {
        const component = { src: './assets/logo.png', alt: 'A logo' };
        const result = buildImage(component, 'component-0');
        expect(result.dataset.componentId).toBe('component-0');
    });

    it('should contain an img element inside the card', () => {
        const component = { src: './assets/logo.png', alt: 'A logo' };
        const result = buildImage(component, 'component-0');
        expect(result.querySelector('img')).not.toBeNull();
    });

    it('should set the src attribute on the img', () => {
        const component = { src: './assets/logo.png', alt: 'A logo' };
        const result = buildImage(component, 'component-0');
        expect(result.querySelector('img').getAttribute('src')).toBe('./assets/logo.png');
    });

    it('should set the alt attribute on the img', () => {
        const component = { src: './assets/logo.png', alt: 'A logo' };
        const result = buildImage(component, 'component-0');
        expect(result.querySelector('img').getAttribute('alt')).toBe('A logo');
    });

});

describe('buildClock', () => {

    beforeEach(() => {
        HTMLCanvasElement.prototype.getContext = () => null;
    });

    it('should return a component-card wrapper div', () => {
        const result = buildClock({}, 'component-0');
        expect(result.tagName).toBe('DIV');
        expect(result.classList.contains('component-card')).toBe(true);
    });

    it('should stamp data-component-id on the card', () => {
        const result = buildClock({}, 'component-0');
        expect(result.dataset.componentId).toBe('component-0');
    });

    it('should contain an inner div with the time text', () => {
        const result = buildClock({}, 'component-0');
        const inner = result.querySelector('div');
        expect(inner).not.toBeNull();
        expect(inner.textContent).toBeTruthy();
    });

    it('should contain a canvas element when mode is analog', () => {
        const result = buildClock({ mode: 'analog' }, 'component-0');
        expect(result.querySelector('canvas')).not.toBeNull();
    });

});
describe('buildWeather', () => {
    const fakeData = { current: { temperature_2m: 72, weathercode: 0 } };

    it('should return a component-card wrapper div', () => {
        const result = buildWeather(fakeData, 'component-5');
        expect(result.tagName).toBe('DIV');
        expect(result.classList.contains('component-card')).toBe(true);
    });

    it('should stamp data-component-id on the card', () => {
        const result = buildWeather(fakeData, 'component-5');
        expect(result.dataset.componentId).toBe('component-5');
    });

    it('should display the city name', () => {
        const result = buildWeather(fakeData, 'component-5');
        expect(result.querySelector('.weather-city').textContent).toBe('Denver');
    });

    it('should display the temperature', () => {
        const result = buildWeather(fakeData, 'component-5');
        expect(result.querySelector('.weather-temp').textContent).toBe('72°');
    });

    it('should display the condition', () => {
        const result = buildWeather(fakeData, 'component-5');
        expect(result.querySelector('.weather-condition').textContent).toBe('Clear sky');
    });
});
describe('buildText', () => {

    it('should return a component-card wrapper div', () => {
        const result = buildText(
            { content: 'Welcome students' },
            'component-9'
        );

        expect(result.tagName).toBe('DIV');
        expect(result.classList.contains('component-card')).toBe(true);
    });

    it('should stamp data-component-id on the card', () => {
        const result = buildText(
            { content: 'Welcome students' },
            'component-9'
        );

        expect(result.dataset.componentId).toBe('component-9');
    });

    it('should display the correct text', () => {
        const result = buildText(
            { content: 'Welcome students' },
            'component-9'
        );

        expect(result.textContent).toContain('Welcome students');
    });

});
describe('fetchWeatherData', () => {
    it('should return parsed JSON from the URL', async () => {
        const fakeData = { city: 'Denver', temperature: 72, condition: 'Sunny' };
        globalThis.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => fakeData,
        });

        const result = await fetchWeatherData('https://fake.weather/api');
        expect(result).toEqual(fakeData);
    });

    it('should throw if the response is not ok', async () => {
        globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

        await expect(fetchWeatherData('https://fake.weather/api'))
            .rejects.toThrow('Weather fetch failed: 404');
    });
});
