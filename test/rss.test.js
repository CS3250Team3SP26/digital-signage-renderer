import { describe, it, expect } from '@jest/globals';
import { parseRssFeed } from '../src/renderer.js';

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