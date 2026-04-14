import { describe, it, expect } from '@jest/globals';
import { buildImage } from '../src/renderer.js';

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
        const img = result.querySelector('img');
        expect(img).not.toBeNull();
    });

    it('should set the src attribute on the img', () => {
        const component = { src: './assets/logo.png', alt: 'A logo' };
        const result = buildImage(component, 'component-0');
        const img = result.querySelector('img');
        expect(img.getAttribute('src')).toBe('./assets/logo.png');
    });

    it('should set the alt attribute on the img', () => {
        const component = { src: './assets/logo.png', alt: 'A logo' };
        const result = buildImage(component, 'component-0');
        const img = result.querySelector('img');
        expect(img.getAttribute('alt')).toBe('A logo');
    });
});
