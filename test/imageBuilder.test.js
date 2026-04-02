import { buildImage } from '../src/renderer.js';
test('buildImage sets the src attribute', () => {
    const component = { src: './assets/logo.png', alt: 'A logo' };
    const result = buildImage(component);
    expect(result.getAttribute('src')).toBe('./assets/logo.png');
});

test('buildImage sets the alt attribute', () => {
    const component = { src: './assets/logo.png', alt: 'A logo' };
    const result = buildImage(component);
    expect(result.getAttribute('alt')).toBe('A logo');
});
test('buildImage creates an img element',()=> {
    const component = {src: './assets/logo.png', alt: 'A logo'}
    const result =  buildImage(component);
    expect(result.tagName).toBe('IMG');
})
