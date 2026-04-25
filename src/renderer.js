// ============================================================
// CONFIG LOADER
// Fetches and validates config.json
// Rejects on missing required fields
// ============================================================
/**
 * Loads the configuration from config.json and validates it against required fields and valid zones
 * @param {Array} ValidZones An array of valid zone identifiers to validate against
 * @returns {Promise<Object>} The loaded configuration object
 * @throws {Error} If there is an error fetching the config.json file
 * @throws {Error} If there is an error parsing the json file
 */
async function loadConfig(ValidZones) {
    const response = await fetch('./config.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    let config;
    try {
        config = await response.json();
    } catch {
        throw new Error("config.json contains invalid JSON - check for syntax errors");
    }
    validateConfig(config, ValidZones);
    return config;
}

/**
 * Validates the configuration object against required fields and valid zones
 * @param {Object} config The configuration object to validate
 * @param {Array} validZones The array of valid zone identifiers
 * @throws {Error} If there are validation errors, with details about missing fields or invalid zones
 */
function validateConfig(config, validZones) {
    const errors = [
        ...validateLayout(config.layout, validZones),
        ...validateComponents(config.components, validZones)
    ];

    if (errors.length > 0) {
        throw new Error(errors.join("\n"));
    }
}

/**
 * Validates the layout configuration, ensuring required fields are present and zones are valid
 * @param {Object} layout The layout configuration object to validate
 * @param {Array} validZones The array of valid zone identifiers
 * @returns {Array} An array of error messages, empty if no errors are found
 */
function validateLayout(layout, validZones) {
    const errors = [];
    if (!layout) {
        errors.push("Missing required field: layout");
    } else if (!Array.isArray(layout.zones) || layout.zones.length === 0) {
        errors.push("layout.zones must be a non-empty array");
    } else {
        const invalidZones = layout.zones.filter(zone => !validZones.includes(zone));
        if (invalidZones.length > 0) {
            errors.push(`Invalid zones: ${invalidZones.join(', ')}`);
        }
    }
    return errors;
}

/**
 * Validates the components configuration, ensuring required fields are present and zones are valid
 * @param {Array} components The array of component configuration objects to validate
 * @param {Array} validZones The array of valid zone identifiers
 * @returns {Array} An array of error messages, empty if no errors are found
 */
function validateComponents(components, validZones) {
    const errors = [];
    if (!components) {
        errors.push("Missing required field: components");
    } else if (!Array.isArray(components) || components.length === 0) {
        errors.push("components must be a non-empty array");
    } else {
        for (const component of components) {
            errors.push(...validateComponent(component, validZones));
        }
    }
    return errors;
}

/**
 * Validates a single component configuration, ensuring required fields are present and the zone is valid
 * @param {Object} component The component configuration object to validate
 * @param {Array} validZones The array of valid zone identifiers
 * @returns {Array} An array of error messages, empty if no errors are found
 */
function validateComponent(component, validZones) {
    const errors = [];
    const type = component.type;
    if (!type) {
        errors.push("Each component must have a type field");
    } else if (REQUIRED_COMPONENT_FIELDS[type]) {
        const missingFields = REQUIRED_COMPONENT_FIELDS[type].filter(field => !component[field]);
        if (missingFields.length > 0) {
            errors.push(`Component of type ${type} is missing required fields: ${missingFields.join(', ')}`);
        }
    } else {
        errors.push(`Unknown component type: ${type}`);
    }
    if (!component.zone) {
        errors.push(`Each component must have a zone field`);
    } else if (!validZones.includes(component.zone)) {
        errors.push(`Each component must have a valid zone: ${component.zone} is an invalid zone`);
    }
    return errors;
}

// ============================================================
// COMPONENT REGISTRY
// Map of type -> builder function
// Register all component types here
// ============================================================
const registry = new Map();

/**
 * Defines the required fields for each component type to ensure proper validation of the configuration
 * When adding a new component type, add an entry here with the type as the key and an array of required field names as the value
 */
const REQUIRED_COMPONENT_FIELDS = {
    image: ['src', 'alt'],
    clock: [],
    rss: ['url'],
    weather: ['url'],
};


/**
 * Registers all component types with their corresponding builder functions
 * This function should be called during the bootstrap phase to ensure all components are available for rendering
 * To add a new component type, simply call registerComponent with the type string and the builder function that creates the DOM element for that component
 */
/* istanbul ignore next */
function registerComponents() {
    // To register a new component add it below
    // ex. registerComponent('type', buildType)
    registerComponent('rss', buildRss);
    registerComponent('image', buildImage);
    registerComponent('clock', buildClock);
}

/**
 * Registers a component type with its corresponding builder function
 * @param {String} type The component type to register
 * @param {Function} buildType The function that creates the DOM element for the component
 * @throws {TypeError} If the type is not a string or the buildType is not a function
 */
function registerComponent(type, buildType) {
    if (typeof type !== 'string') {
        throw new TypeError(`Type must be a string`);
    }
    if (typeof buildType !== 'function') {
        throw new TypeError(`Builder function for type ${type} is not a function`);
    }
    registry.set(type, buildType);
}
/**
 * Retrieves the builder function for a given component type from the registry
 * @param {String} type The component type to retrieve
 * @returns {Function} The builder function for the specified component type
 * @throws {TypeError} If the type is not a string or the builder function is not found
 */
function getComponent(type) {
    if (typeof type !== 'string') {
        throw new TypeError(`Type must be a string`);
    }
    if (!registry.has(type)) {
        throw new Error(`Component of type ${type} is missing a registered builder`)
    }
    return registry.get(type);
}


// ============================================================
// COMPONENT BUILDERS
// One pure function per component type
// Input: config object  Output: DOM element
// These are the unit-testable surface
// ============================================================
/**
 * Builds an image component element based on the provided component configuration
 * @param {Object} component - The component configuration object containing src and alt fields
 * @param {string} id - The unique identifier to set as the data-component-id attribute
 * @returns {HTMLElement} The constructed img element
 */
function buildImage(component, id){
    const card = document.createElement('div');
    card.className = 'component-card';
    card.dataset.componentId = id;

    const img = document.createElement('img');
    img.setAttribute('src', component.src);
    img.setAttribute('alt', component.alt);

    card.appendChild(img);
    return card;
}

/**
 * Parses an RSS XML string and returns an array of item titles
 * @param {string} xmlString - The raw XML string from an RSS feed
 * @returns {string[]} An array of title strings extracted from each <item> element
 */
function parseRssFeed(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const items = doc.querySelectorAll('item');
    const titles = Array.from(items).map(item => item.querySelector('title').textContent);
    return titles;
}

/**
 * Builds an RSS component element that fetches and displays feed item titles
 * @param {Object} component - The component configuration object containing a url field
 * @param {string} id - The unique identifier to set as the data-component-id attribute
 * @returns {HTMLElement} The constructed card div (fetch populates it asynchronously)
 */
/* istanbul ignore next */
function buildRss(component, id) {
    const card = document.createElement('div');
    card.className = 'component-card';
    card.dataset.componentId = id;

    fetch(component.url)
        .then(response => response.text())
        .then(text => {
            const titles = parseRssFeed(text);
            titles.forEach(title => {
                const p = document.createElement('p');
                p.textContent = title;
                card.appendChild(p);
            });
        });

    return card;
}

/**
 * Fetches weather data from the provided URL
 * @param {string} url - The URL to fetch weather data from
 * @returns {Promise<Object>} The weather data object
 */
async function fetchWeatherData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Weather fetch failed: ${response.status}`);
    }
    return response.json();
}
/**
 * Builds a weather component element from weather data
 * @param {Object} data - The weather data object (e.g. from an API response)
 * @param {string} id - The unique identifier to set as data-component-id
 * @returns {HTMLElement} The constructed weather card element
 */
function buildWeather(data, id) {
    const card = document.createElement('div');
    card.className = 'component-card';
    card.dataset.componentId = id;

    const weatherDescriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        61: "Light rain",
        63: "Moderate rain",
        80: "Rain showers",
        95: "Thunderstorm"
    };

    const city = document.createElement('div');
    city.className = 'weather-city';
    city.textContent = "Denver";

    const temp = document.createElement('div');
    temp.className = 'weather-temp';
    temp.textContent = `${data.current.temperature_2m}°`;

    const condition = document.createElement('div');
    condition.className = 'weather-condition';
    condition.textContent = weatherDescriptions[data.current.weathercode];

    const humidity = document.createElement('div');
    humidity.className = 'weather-humidity';
    humidity.innerHTML = `<span>Humidity</span><span>${data.current.relative_humidity_2m}%</span>`;

    const wind = document.createElement('div');
    wind.className = 'weather-wind';
    wind.innerHTML = `<span>Wind</span><span>${data.current.wind_speed_10m} mph</span>`;

    const feelsLike = document.createElement('div');
    feelsLike.className = 'weather-feels-like';
    feelsLike.innerHTML = `<span>Feels like</span><span>${data.current.apparent_temperature}°F</span>`;

    card.appendChild(city);
    card.appendChild(temp);
    card.appendChild(condition);
    card.appendChild(humidity);
    card.appendChild(wind);
    card.appendChild(feelsLike);
    return card;
}

/**
 * Builds a clock component element based on the provided component configuration
 * If the mode is "analog", returns a svg element of an analog clock.
 * Otherwise, returns a div element displaying the current time as text.
 * @param {Object} component - The component configuration object containing the mode field
 * @param {string} id - The unique identifier to set as the data-component-id attribute
 * @returns {HTMLElement} The constructed clock element, either a svg or a div
 */
function buildClock(component, id) {
    const card = document.createElement('div');
    card.className = 'component-card clock-card';
    card.dataset.componentId = id;

    if (component.mode === "analog") {
        const clock = drawAnalogClock();
        card.appendChild(clock);
    } else {
        const time = document.createElement('div');
        time.className = 'clock-time';
        time.textContent = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const date = document.createElement('div');
        date.className = 'clock-date';
        date.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        card.appendChild(time);
        card.appendChild(date);
    }
    return card;
}

/**
 * Draws an analog clock as an SVG element
 * @returns {HTMLElement} The constructed SVG element representing the analog clock
 */
/* istanbul ignore next */
// Hand update refactor planned — see updater branch
// drawAnalogClock will be split into drawClockFace/drawClockHands
// with date parameter for testability at that point
function drawAnalogClock() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');

    // clock face
    const face = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    face.setAttribute('cx', '50');   // center x
    face.setAttribute('cy', '50');   // center y
    face.setAttribute('r', '48');    // radius
    face.setAttribute('fill', '#1a1a1a');
    face.setAttribute('stroke', 'rgba(255,255,255,0.1)');
    face.setAttribute('stroke-width', '0.5');
    svg.appendChild(face);

    // hour ticks
    for (let i = 0; i < 12; i++) {
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', '50');
        tick.setAttribute('y1', '5');   // outer edge
        tick.setAttribute('x2', '50');
        tick.setAttribute('y2', '10');  // inner edge — length of tick
        tick.setAttribute('stroke', 'rgba(255,255,255,0.5)');
        tick.setAttribute('stroke-width', '1');
        tick.setAttribute('transform', `rotate(${i * 30}, 50, 50)`);
        svg.appendChild(tick);
    }

    const time = new Date();

    // minute hand
    const minuteHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    minuteHand.setAttribute('x1', '50');  // start x (center)
    minuteHand.setAttribute('y1', '50');  // start y (center)
    minuteHand.setAttribute('x2', '50');  // end x (pointing straight up)
    minuteHand.setAttribute('y2', '10');  // end y (toward 12 o'clock)
    minuteHand.setAttribute('stroke', 'white');
    minuteHand.setAttribute('stroke-width', '1.5');
    minuteHand.setAttribute('stroke-linecap', 'round'); // rounded tip
    minuteHand.setAttribute('transform', `rotate(${time.getMinutes() * 6}, 50, 50)`); // Rotate based on minutes
    svg.appendChild(minuteHand);

    // hour hand
    const hourHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hourHand.setAttribute('x1', '50');  // start x (center)
    hourHand.setAttribute('y1', '50');  // start y (center)
    hourHand.setAttribute('x2', '50');  // end x (pointing straight up)
    hourHand.setAttribute('y2', '10');  // end y (toward 12 o'clock)
    hourHand.setAttribute('stroke', 'white');
    hourHand.setAttribute('stroke-width', '1.5');
    hourHand.setAttribute('stroke-linecap', 'round'); // rounded tip
    hourHand.setAttribute('transform', `rotate(${(time.getHours() % 12) * 30 + time.getMinutes() / 2}, 50, 50)`); // Rotate based on hours and minutes
    svg.appendChild(hourHand);

    // second hand
    const secondHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    secondHand.setAttribute('x1', '50');
    secondHand.setAttribute('y1', '50');
    secondHand.setAttribute('x2', '50');
    secondHand.setAttribute('y2', '8');
    secondHand.setAttribute('stroke', 'rgba(255, 255, 255, 0.26)');
    secondHand.setAttribute('stroke-width', '1');
    secondHand.setAttribute('stroke-linecap', 'round');
    secondHand.setAttribute('transform', `rotate(${time.getSeconds() * 6}, 50, 50)`);
    svg.appendChild(secondHand);

    // center dot
    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', '50');
    center.setAttribute('cy', '50');
    center.setAttribute('r', '1.5');
    center.setAttribute('fill', 'white');
    svg.appendChild(center);

    return svg;
}


// ============================================================
// SCHEDULER
// Handles per-component refresh intervals
// Uses setInterval, respects component.refresh field
// ============================================================
/* istanbul ignore next */

/**
 * Rendes a single component into the target zone
 * Clears the zones exsisting content and bulds the DOm elemetn and appends it
 * @param {Object} component The component configuration object to render
 * @param {HTMLElement} zoneElem the targetzone DOM element
 */
async function renderComponent(component, zoneElem, id) {
    const builder = getComponent(component.type);
    const element = await builder(component, id);
    const existing = zoneElem.querySelector(`[data-component-id="${id}"]`);
    if (existing) {
        existing.replaceWith(element);
    } else {
        zoneElem.appendChild(element);
    }
}

/**
 * Schedules a component to be rendered and an optional periodic refresh
 * 
 * - Renders the component immediately on call
 * - If the 'component.refresh' is a positive number, it sets up a repeating interval that re-renders the component at that cadence
 * - Returns a cleanup handle so callers can cancel the interval later 
 * 
 * @param {Object} component The component config object
 * @param {HTMLElement} zoneElem the target zone DOM element
 * @returns {Object} An object with intervalId and cancel properties
 * @returns {(number|null)} intervalId - The value returned by setInterval, or null if no interval was created
 * @returns {Function} cancel - A zero-argument function that stops the interval
 */
function scheduleComponent(component, zoneElem, id) {
    if (typeof component.refresh !== 'number' || component.refresh <= 0) {
        return { intervalId: null, cancel() {} };
    }
    const intervalId = setInterval(async () => {
        await renderComponent(component, zoneElem, id);
    }, component.refresh);
    return {
        intervalId,
        cancel() {
            clearInterval(intervalId);
        }
    };
}

/**
 * Cancels all active scheduler handles returned by bootstrap
 * Safe to call multiple times; already-cancelled handles are no-ops
 * @param {Array<{ cancel: Function }>} handles
 */
function cancelAll(handles) {
    for (const handle of handles) {
        handle.cancel();
    }
}


// ============================================================
// BOOTSTRAP
// Entry point - wires everything together
// Runs on DOMContentLoaded
// ============================================================

/**
 * Bootstraps the application by loading the configuration, registering components, and rendering them in their respective zones
 * This function is called when the DOMContentLoaded event is fired, ensuring that the DOM is fully loaded before attempting to manipulate it
 * It handles errors gracefully by catching exceptions and displaying an error message on the page if the configuration fails to load or is invalid
 */
/* istanbul ignore next */
async function bootstrap() {
    try {
        const zoneElems = new Map(Array.from(document.querySelectorAll('.zone')).map(el => [el.id, el]));
        const config = await loadConfig(Array.from(zoneElems.keys()));
        document.documentElement.style.setProperty('--color-bg', config.theme?.background ?? '#111111');
        document.documentElement.style.setProperty('--color-text', config.theme?.color ?? '#ffffff');
        document.documentElement.style.setProperty('--color-secondary', config.theme?.secondaryColor ?? '#888888');
        document.documentElement.style.setProperty('--font-family', config.theme?.fontFamily ?? 'sans-serif');
        registerComponents();

        for (const [i, component] of config.components.entries()) {
            const id = `component-${i}`;
            const zoneElem = zoneElems.get(component.zone);
            await renderComponent(component, zoneElem, id);
            if (component.refresh) {
                scheduleComponent(component, zoneElem, id);
            }
        }
    }
    catch (error) {
        console.error("Error during bootstrap:", error);
        const errorElement = document.createElement('div');
        errorElement.style.color = 'red';
        errorElement.textContent = `Error loading configuration: ${error.message}`;
        document.body.appendChild(errorElement);
    }
}

document.addEventListener('DOMContentLoaded', bootstrap);

export {
    loadConfig,
    validateConfig,
    validateLayout,
    validateComponents,
    validateComponent,
    registerComponent,
    getComponent,
    buildImage,
    bootstrap,
    buildClock,
    scheduleComponent,
    cancelAll,
    renderComponent,
    buildWeather,
    fetchWeatherData,
    buildRss,
    parseRssFeed,
};
