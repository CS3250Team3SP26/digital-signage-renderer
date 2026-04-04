import { jest, describe, it, expect } from '@jest/globals';
import { getComponent, registerComponent } from '../src/renderer.js';

describe(`registerComponent and getComponent`, () => {

    const mockBuilder = jest.fn();

    it(`should add a new component to the registry and return the correct builder`, () => {
        registerComponent('test', mockBuilder);
        expect(getComponent('test')).toBe(mockBuilder);
    });

    it(`should throw when passed type is not a String`, () => {
        expect(() => registerComponent(123, mockBuilder)).toThrow(`Type must be a string`);
        expect(() => registerComponent(null, mockBuilder)).toThrow(`Type must be a string`);
        expect(() => registerComponent(undefined, mockBuilder)).toThrow(`Type must be a string`);
    });

    it(`should throw when passed builder function is not a function`, () => {
        expect(() => registerComponent(`type`, null)).toThrow(`Builder function for type type is not a function`);
        expect(() => registerComponent(`type`, undefined)).toThrow(`Builder function for type type is not a function`);
        expect(() => registerComponent(`type`, `String`)).toThrow(`Builder function for type type is not a function`);
        expect(() => registerComponent(`type`, 123)).toThrow(`Builder function for type type is not a function`);
    });

    it(`should throw when passed type is not a String`, () => {
        expect(() => getComponent(123)).toThrow(`Type must be a string`);
        expect(() => getComponent(null)).toThrow(`Type must be a string`);
        expect(() => getComponent(undefined)).toThrow(`Type must be a string`);
    });

    it(`should throw when builder function is not found for a given type`, () => {
        expect(() => getComponent('nonexistent')).toThrow(`Component of type nonexistent is missing a registered builder`);
    });

});