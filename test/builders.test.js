<<<<<<< HEAD
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { buildImage, buildClock , buildWeather, buildText, fetchWeatherData} from '../src/renderer.js';
=======
import { jest, describe, it, expect } from '@jest/globals';
import { buildImage, buildClock, buildWeather, fetchWeatherData, parseRssFeed } from '../src/renderer.js';
>>>>>>> 87a9a3b7285c382d022c7cc7a7cf44aa52092b51


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

    it('should contain an svg element when mode is analog', () => {
        const result = buildClock({ mode: 'analog' }, 'component-0');
        expect(result.querySelector('svg')).not.toBeNull();
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

describe('parseRssFeed', () => {

    it('should return the second title at index 0', () => {
        const xml = `<rss><channel>
        <item><title>First headline</title></item>
        <item><title>Second headline</title></item>
        </channel></rss>`;
        const result = parseRssFeed(xml);
        expect(result[0]).toBe('First headline');
    });

    it('should return the second title at index 1', () => {
        const xml = `<rss><channel>
        <item><title>First headline</title></item>
        <item><title>Second headline</title></item>
        </channel></rss>`;
        const result = parseRssFeed(xml);
        expect(result[1]).toBe('Second headline');
    });

    it('should return an array of length 0 if array is empty', () => {
        const xml = ``;
        const result = parseRssFeed(xml);
        expect(result.length).toBe(0);
    });
});
