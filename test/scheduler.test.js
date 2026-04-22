/**
 * @jest-environment jsdom
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
    renderComponent,
    scheduleComponent,
    cancelAll,
    registerComponent,
} from '../src/renderer.js';

// ==================================================================================
//                                   HELPERS
// ==================================================================================

/** Creates a detached div and adds it to the document with a given id. */
function createZone(id) {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
    return el;
}

/** Removes every child of document.body between tests. */
function clearDOM() {
    document.body.innerHTML = '';
}

/** A minimal builder stub that returns a <span> containing a counter value. */
function makeBuilder(label = 'item') {
    let count = 0;
    const build = jest.fn(() => {
        const span = document.createElement('span');
        span.textContent = `${label}-${++count}`;
        return span;
    });
    return build;
}

// ==============================================================================
//                                  SETOUP
// ==============================================================================

beforeEach(() => {
    jest.useFakeTimers();
    clearDOM();
    // Register the two built-in types used across tests
    registerComponent('image', makeBuilder('image'));
    registerComponent('widget', makeBuilder('widget'));
});

afterEach(() => {
    jest.useRealTimers();
    // Clear the registry so tests don't bleed into each other.
    // We reach into the module-level Map via getComponent's closure; the
    // simplest way is to re-register with a fresh stub in each beforeEach.
});

// ==============================================================================
//                                RENDER COMPONENT
// ==============================================================================

describe('renderComponent', () => {
    test('calls the registered builder and appends the result to the zone', () => {
        const builder = jest.fn(() => document.createElement('img'));
        registerComponent('photo', builder);

        const zone = createZone('z1');
        const component = { type: 'photo', zone: 'z1' };

        renderComponent(component, zone);

        expect(builder).toHaveBeenCalledTimes(1);
        expect(builder).toHaveBeenCalledWith(component, undefined);
        expect(zone.children).toHaveLength(1);
        expect(zone.children[0].tagName).toBe('IMG');
    });

    test('clears existing zone content before appending the new element', () => {
        const zone = createZone('z2');
        zone.innerHTML = '<p>old content</p><p>more old content</p>';

        registerComponent('clean', () => document.createElement('span'));
        renderComponent({ type: 'clean', zone: 'z2' }, zone);

        expect(zone.children).toHaveLength(1);
        expect(zone.querySelector('p')).toBeNull();
    });

    test('throws when the component type has no registered builder', () => {
        const zone = createZone('z3');
        expect(() =>
            renderComponent({ type: 'unregistered', zone: 'z3' }, zone)
        ).toThrow(/unregistered/);
    });

    test('renders on every call (called multiple times, zone always has one child)', () => {
        const zone = createZone('z4');
        registerComponent('counter', makeBuilder('c'));

        for (let i = 0; i < 5; i++) {
            renderComponent({ type: 'counter', zone: 'z4' }, zone);
            expect(zone.children).toHaveLength(1);
        }
    });
});

// ==============================================================================
//                                SCHEDULE COMPONENT
// ==============================================================================

describe('scheduleComponent', () => {
    test('does not render the component on call (bootstrap owns initial render)', () => {
        const builder = jest.fn(() => document.createElement('div'));
        registerComponent('imm', builder);

        const zone = createZone('s1');
        scheduleComponent({ type: 'imm', zone: 's1', refresh: 1000 }, zone, 'component-0');

        expect(builder).toHaveBeenCalledTimes(0);
        expect(zone.children).toHaveLength(0);
    });

    test('returns a handle with intervalId === null when no refresh is set', () => {
        registerComponent('noref', () => document.createElement('div'));
        const zone = createZone('s2');

        const handle = scheduleComponent({ type: 'noref', zone: 's2' }, zone, 'component-0');

        expect(handle.intervalId).toBeNull();
        expect(typeof handle.cancel).toBe('function');
    });

    test('returns a handle with a numeric intervalId when refresh > 0', () => {
        registerComponent('withref', () => document.createElement('div'));
        const zone = createZone('s3');

        const handle = scheduleComponent(
            { type: 'withref', zone: 's3', refresh: 1000 },
            zone,
            'component-0'
        );

        expect(typeof handle.intervalId).toBe('number');
        handle.cancel();
    });

    test('re-renders the component after each refresh interval elapses', () => {
        const builder = jest.fn(() => document.createElement('span'));
        registerComponent('tick', builder);
        const zone = createZone('s4');

        scheduleComponent({ type: 'tick', zone: 's4', refresh: 500 }, zone, 'component-0');
        expect(builder).toHaveBeenCalledTimes(0); // bootstrap owns initial render

        jest.advanceTimersByTime(500);
        expect(builder).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(500);
        expect(builder).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(1500); // 3 more ticks
        expect(builder).toHaveBeenCalledTimes(5);
    });

    test('does NOT set an interval when refresh is 0', () => {
        registerComponent('zero', () => document.createElement('div'));
        const zone = createZone('s5');

        const handle = scheduleComponent(
            { type: 'zero', zone: 's5', refresh: 0 },
            zone,
            'component-0'
        );

        jest.advanceTimersByTime(10_000);
        expect(handle.intervalId).toBeNull();
    });

    test('does NOT set an interval when refresh is negative', () => {
        registerComponent('neg', () => document.createElement('div'));
        const zone = createZone('s6');

        const handle = scheduleComponent(
            { type: 'neg', zone: 's6', refresh: -500 },
            zone,
            'component-0'
        );

        jest.advanceTimersByTime(10_000);
        expect(handle.intervalId).toBeNull();
    });

    test('does NOT set an interval when refresh is a non-numeric string', () => {
        registerComponent('str', () => document.createElement('div'));
        const zone = createZone('s7');

        const handle = scheduleComponent(
            { type: 'str', zone: 's7', refresh: '1000' },
            zone,
            'component-0'
        );

        expect(handle.intervalId).toBeNull();
    });

    test('cancel() stops future re-renders', () => {
        const builder = jest.fn(() => document.createElement('span'));
        registerComponent('stoppable', builder);
        const zone = createZone('s8');

        const handle = scheduleComponent(
            { type: 'stoppable', zone: 's8', refresh: 300 },
            zone,
            'component-0'
        );

        jest.advanceTimersByTime(300);
        expect(builder).toHaveBeenCalledTimes(1); // 1 tick (no initial render)

        handle.cancel();
        jest.advanceTimersByTime(3000); // would fire 10 more times without cancel
        expect(builder).toHaveBeenCalledTimes(1); // no additional renders
    });

    test('cancel() is safe to call multiple times (idempotent)', () => {
        registerComponent('idm', () => document.createElement('div'));
        const zone = createZone('s9');

        const handle = scheduleComponent(
            { type: 'idm', zone: 's9', refresh: 200 },
            zone,
            'component-0'
        );

        expect(() => {
            handle.cancel();
            handle.cancel();
            handle.cancel();
        }).not.toThrow();
    });

    test('cancel() on a no-refresh handle is a no-op', () => {
        registerComponent('noop', () => document.createElement('div'));
        const zone = createZone('s10');

        const handle = scheduleComponent({ type: 'noop', zone: 's10' }, zone, 'component-0');

        expect(() => handle.cancel()).not.toThrow();
    });
});

// ==============================================================================
//                                CANCEL ALL
// ==============================================================================

describe('cancelAll', () => {
    test('stops all active intervals', () => {
        const builder = jest.fn(() => document.createElement('div'));
        registerComponent('ca', builder);

        const zone1 = createZone('ca1');
        const zone2 = createZone('ca2');

        const h1 = scheduleComponent({ type: 'ca', zone: 'ca1', refresh: 200 }, zone1, 'component-0');
        const h2 = scheduleComponent({ type: 'ca', zone: 'ca2', refresh: 200 }, zone2, 'component-1');

        cancelAll([h1, h2]);
        jest.advanceTimersByTime(2000);

        expect(builder).toHaveBeenCalledTimes(0); // no renders — bootstrap owns initial render
    });

    test('is safe to call on an empty array', () => {
        expect(() => cancelAll([])).not.toThrow();
    });

    test('is safe to call multiple times on the same handles', () => {
        registerComponent('safe', () => document.createElement('div'));
        const zone = createZone('ca3');

        const handle = scheduleComponent({ type: 'safe', zone: 'ca3', refresh: 100 }, zone, 'component-0');

        expect(() => {
            cancelAll([handle]);
            cancelAll([handle]);
        }).not.toThrow();
    });

    test('handles without refresh intervals are cancelled without error', () => {
        registerComponent('nointerval', () => document.createElement('div'));
        const zone = createZone('ca4');

        const handle = scheduleComponent({ type: 'nointerval', zone: 'ca4' }, zone, 'component-0');

        expect(() => cancelAll([handle])).not.toThrow();
    });

    test('cancelling one handle does not affect others', () => {
        const builder = jest.fn(() => document.createElement('span'));
        registerComponent('ind', builder);

        const zone1 = createZone('ca5');
        const zone2 = createZone('ca6');

        const h1 = scheduleComponent({ type: 'ind', zone: 'ca5', refresh: 300 }, zone1, 'component-0');
        scheduleComponent({ type: 'ind', zone: 'ca6', refresh: 300 }, zone2, 'component-1');

        h1.cancel();
        jest.advanceTimersByTime(900); // 3 ticks

        // h1 cancelled, h2 fires 3 ticks
        expect(builder).toHaveBeenCalledTimes(3);
    });
});