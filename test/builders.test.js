import { describe, it, expect } from '@jest/globals';
import { buildImage } from '../src/renderer.js';

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
