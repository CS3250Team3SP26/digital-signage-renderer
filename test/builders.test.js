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
describe('buildClock',() =>{ 
    
    it('should create a div element', () => {
        const component = {};
        const id = 'component-0';

        const result = buildClock(component, id);

        expect(result.tagName).toBe('DIV');
    });
    it('verify test content is present', () => {
        const component = {};
        const id = 'component-1';

        const result = buildClock(component, id);

        expect(result.textContent).toBeTruthy();
    });
    it('verify data-component-id is set correctly', () => {
        const component = {};
        const id = 'component-1';

        const result = buildClock(component, id);

        expect(result.getAttribute('data-component-id')).toBe(id);
    });
    it('test for analog clock', () => {
        const component = {mode: "analog"};
        const id = 'component-0';
    
        const result = buildClock(component, id);
    
        expect(result.tagName).toBe('CANVAS');
    });

});