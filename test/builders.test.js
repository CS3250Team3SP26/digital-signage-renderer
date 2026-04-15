import { describe, it, expect, beforeEach } from '@jest/globals';
import { buildImage, buildClock } from '../src/renderer.js';


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
