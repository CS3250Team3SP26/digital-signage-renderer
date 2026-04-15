import { describe, it, expect } from '@jest/globals';
import { buildImage, buildClock } from '../src/renderer.js';


describe('buildImage', () => {

    it('should set the src attribute', () => {
        const component = { src: './assets/logo.png', alt: 'A logo' };
        const result = buildImage(component);
        expect(result.getAttribute('src')).toBe('./assets/logo.png');
    });

    it('should set the alt attribute', () => {
        const component = { src: './assets/logo.png', alt: 'A logo' };
        const result = buildImage(component);
        expect(result.getAttribute('alt')).toBe('A logo');
    });

    it('should create an img element', () => {
        const component = { src: './assets/logo.png', alt: 'A logo' };
        const result = buildImage(component);
        expect(result.tagName).toBe('IMG');
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

});