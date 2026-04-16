/**
 * @jest-environment jsdom
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
    renderComponent,
    scheduleComponent,
    scheduleAll,
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
        expect(builder).toHaveBeenCalledWith(component);
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
    test('renders the component immediately (before any timers advance)', () => {
        const builder = jest.fn(() => document.createElement('div'));
        registerComponent('imm', builder);

        const zone = createZone('s1');
        scheduleComponent({ type: 'imm', zone: 's1' }, zone);

        expect(builder).toHaveBeenCalledTimes(1);
        expect(zone.children).toHaveLength(1);
    });

    test('returns a handle with intervalId === null when no refresh is set', () => {
        registerComponent('noref', () => document.createElement('div'));
        const zone = createZone('s2');

        const handle = scheduleComponent({ type: 'noref', zone: 's2' }, zone);

        expect(handle.intervalId).toBeNull();
        expect(typeof handle.cancel).toBe('function');
    });

    test('returns a handle with a numeric intervalId when refresh > 0', () => {
        registerComponent('withref', () => document.createElement('div'));
        const zone = createZone('s3');

        const handle = scheduleComponent(
            { type: 'withref', zone: 's3', refresh: 1000 },
            zone
        );

        expect(typeof handle.intervalId).toBe('number');
        handle.cancel();
    });

    test('re-renders the component after each refresh interval elapses', () => {
        const builder = jest.fn(() => document.createElement('span'));
        registerComponent('tick', builder);
        const zone = createZone('s4');

        scheduleComponent({ type: 'tick', zone: 's4', refresh: 500 }, zone);
        expect(builder).toHaveBeenCalledTimes(1); // initial render

        jest.advanceTimersByTime(500);
        expect(builder).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(500);
        expect(builder).toHaveBeenCalledTimes(3);

        jest.advanceTimersByTime(1500); // 3 more ticks
        expect(builder).toHaveBeenCalledTimes(6);
    });

    test('does NOT set an interval when refresh is 0', () => {
        registerComponent('zero', () => document.createElement('div'));
        const zone = createZone('s5');

        const handle = scheduleComponent(
            { type: 'zero', zone: 's5', refresh: 0 },
            zone
        );

        jest.advanceTimersByTime(10_000);
        expect(handle.intervalId).toBeNull();
    });

    test('does NOT set an interval when refresh is negative', () => {
        registerComponent('neg', () => document.createElement('div'));
        const zone = createZone('s6');

        const handle = scheduleComponent(
            { type: 'neg', zone: 's6', refresh: -500 },
            zone
        );

        jest.advanceTimersByTime(10_000);
        expect(handle.intervalId).toBeNull();
    });

    test('does NOT set an interval when refresh is a non-numeric string', () => {
        registerComponent('str', () => document.createElement('div'));
        const zone = createZone('s7');

        const handle = scheduleComponent(
            { type: 'str', zone: 's7', refresh: '1000' },
            zone
        );

        expect(handle.intervalId).toBeNull();
    });

    test('cancel() stops future re-renders', () => {
        const builder = jest.fn(() => document.createElement('span'));
        registerComponent('stoppable', builder);
        const zone = createZone('s8');

        const handle = scheduleComponent(
            { type: 'stoppable', zone: 's8', refresh: 300 },
            zone
        );

        jest.advanceTimersByTime(300);
        expect(builder).toHaveBeenCalledTimes(2); // initial + 1 tick

        handle.cancel();
        jest.advanceTimersByTime(3000); // would fire 10 more times without cancel
        expect(builder).toHaveBeenCalledTimes(2); // no additional renders
    });

    test('cancel() is safe to call multiple times (idempotent)', () => {
        registerComponent('idm', () => document.createElement('div'));
        const zone = createZone('s9');

        const handle = scheduleComponent(
            { type: 'idm', zone: 's9', refresh: 200 },
            zone
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

        const handle = scheduleComponent({ type: 'noop', zone: 's10' }, zone);

        expect(() => handle.cancel()).not.toThrow();
    });
});

// ==============================================================================
//                                SCHEDULE ALL
// ==============================================================================

describe('scheduleAll', () => {
    test('returns one handle per component whose zone exists', () => {
        createZone('a1');
        createZone('a2');

        registerComponent('t1', () => document.createElement('div'));
        registerComponent('t2', () => document.createElement('div'));

        const handles = scheduleAll([
            { type: 't1', zone: 'a1' },
            { type: 't2', zone: 'a2' },
        ]);

        expect(handles).toHaveLength(2);
    });

    test('renders all components immediately', () => {
        const b1 = jest.fn(() => document.createElement('div'));
        const b2 = jest.fn(() => document.createElement('div'));
        registerComponent('c1', b1);
        registerComponent('c2', b2);

        createZone('a3');
        createZone('a4');

        scheduleAll([
            { type: 'c1', zone: 'a3' },
            { type: 'c2', zone: 'a4' },
        ]);

        expect(b1).toHaveBeenCalledTimes(1);
        expect(b2).toHaveBeenCalledTimes(1);
    });

    test('skips components whose zone element does not exist and emits a warning', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        registerComponent('missing', () => document.createElement('div'));

        const handles = scheduleAll([
            { type: 'missing', zone: 'does-not-exist' },
        ]);

        expect(handles).toHaveLength(0);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toMatch(/does-not-exist/);

        warnSpy.mockRestore();
    });

    test('processes valid zones even when an earlier zone is missing', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const builder = jest.fn(() => document.createElement('span'));
        registerComponent('good', builder);
        createZone('valid-zone');

        const handles = scheduleAll([
            { type: 'good', zone: 'missing-zone' },
            { type: 'good', zone: 'valid-zone' },
        ]);

        expect(handles).toHaveLength(1);
        expect(builder).toHaveBeenCalledTimes(1);

        warnSpy.mockRestore();
    });

    test('returns an empty array for an empty components list', () => {
        const handles = scheduleAll([]);
        expect(handles).toEqual([]);
    });

    test('all refresh intervals fire independently', () => {
        const b1 = jest.fn(() => document.createElement('div'));
        const b2 = jest.fn(() => document.createElement('div'));
        registerComponent('fast', b1);
        registerComponent('slow', b2);

        createZone('f1');
        createZone('f2');

        scheduleAll([
            { type: 'fast', zone: 'f1', refresh: 100 },
            { type: 'slow', zone: 'f2', refresh: 500 },
        ]);

        jest.advanceTimersByTime(500);

        // fast: initial + 5 ticks; slow: initial + 1 tick
        expect(b1).toHaveBeenCalledTimes(6);
        expect(b2).toHaveBeenCalledTimes(2);
    });
});

// ==============================================================================
//                                CANCEL ALL
// ==============================================================================

describe('cancelAll', () => {
    test('stops all active intervals', () => {
        const builder = jest.fn(() => document.createElement('div'));
        registerComponent('ca', builder);

        createZone('ca1');
        createZone('ca2');

        const handles = scheduleAll([
            { type: 'ca', zone: 'ca1', refresh: 200 },
            { type: 'ca', zone: 'ca2', refresh: 200 },
        ]);

        expect(builder).toHaveBeenCalledTimes(2); // two initial renders

        cancelAll(handles);
        jest.advanceTimersByTime(2000);

        expect(builder).toHaveBeenCalledTimes(2); // no additional renders
    });

    test('is safe to call on an empty array', () => {
        expect(() => cancelAll([])).not.toThrow();
    });

    test('is safe to call multiple times on the same handles', () => {
        registerComponent('safe', () => document.createElement('div'));
        createZone('ca3');

        const handles = scheduleAll([{ type: 'safe', zone: 'ca3', refresh: 100 }]);

        expect(() => {
            cancelAll(handles);
            cancelAll(handles);
        }).not.toThrow();
    });

    test('handles without refresh intervals are cancelled without error', () => {
        registerComponent('nointerval', () => document.createElement('div'));
        createZone('ca4');

        const handles = scheduleAll([{ type: 'nointerval', zone: 'ca4' }]);

        expect(() => cancelAll(handles)).not.toThrow();
    });

    test('cancelling one handle does not affect others', () => {
        const builder = jest.fn(() => document.createElement('span'));
        registerComponent('ind', builder);

        createZone('ca5');
        createZone('ca6');

        const handles = scheduleAll([
            { type: 'ind', zone: 'ca5', refresh: 300 },
            { type: 'ind', zone: 'ca6', refresh: 300 },
        ]);

        handles[0].cancel(); // cancel only the first
        jest.advanceTimersByTime(900); // 3 ticks

        // First was cancelled; second fired 3 more times (initial already counted = 4 total)
        // builder called: 2 initial + 3 ticks from handle[1] = 5
        expect(builder).toHaveBeenCalledTimes(5);
    });
});