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
    clock: [], // no required fields for clock, mode is optional
    rss: ['url']
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
    // registerComponent('rss', buildRss);
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
 * Builds a clock component element based on the provided component configuration
 * If the mode is "analog", returns a canvas element with an analog clock drawn on it.
 * Otherwise, returns a div element displaying the current time as text.
 * @param {Object} component - The component configuration object containing the mode field
 * @param {string} id - The unique identifier to set as the data-component-id attribute
 * @returns {HTMLElement} The constructed clock element, either a canvas or a div
 */
function buildClock(component, id) {
    const card = document.createElement('div');
    card.className = 'component-card';
    card.dataset.componentId = id;

    if (component.mode === "analog") {
        const canvas = document.createElement('canvas') 
        drawAnalogClock(canvas);
        card.appendChild(canvas);
    } else {
        const div = document.createElement('div');
        div.textContent = new Date().toLocaleTimeString();
        card.appendChild(div);
    }
    return card;
}
/**
 * Draws an analog clock on the provided canvas element,
 * including a clock face, hour hand, and minute hand pointing to the current time
 * @param {HTMLCanvasElement} canvas - The canvas element to draw the clock on
 * @returns {void}
 */
/* istanbul ignore next */
function drawAnalogClock(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let radius = canvas.height / 2;
    ctx.translate(radius, radius);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    const now = new Date();

    const hourAngle = ((now.getHours() % 12) / 12) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
    Math.sin(hourAngle) * radius * 0.5,
    -Math.cos(hourAngle) * radius * 0.5
);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.stroke();

    const minuteAngle = ((now.getMinutes() / 60)) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
    Math.sin(minuteAngle) * radius * 0.7,
    -Math.cos(minuteAngle) * radius * 0.7
);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.stroke();
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
function renderComponent(component, zoneElem, id) {
    const builder = getComponent(component.type);
    const element = builder(component, id);
    zoneElem.innerHTML = '';
    zoneElem.appendChild(element);
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
function scheduleComponent(component, zoneElem){
    const intervalId = setInterval(() => {
        renderComponent(component, zoneElem);
    }, component.refresh);
 
    return {
        intervalId,
        cancel() {
            clearInterval(intervalId);
        }
    };
}

/**
 * Schedules all components in the config returning an array of handles
 * that can each be canceled independently or all at once
 * 
 * Components whose target elements do not exist in the DOM are skipped with 
 * a console warning rather than throwing so that one bad zone doesn't stop the rest
 * 
 * @param {Object[]} components - Array of component config objects 
 * @returns {Array<Object>} Scheduler handles with intervalId and cancel properties
 */
function scheduleAll(components) {
    const handles = [];
 
    for (const component of components) {
        if (typeof component.refresh !== 'number' || component.refresh <= 0) continue;
 
        const zoneElem = document.getElementById(component.zone);
        if (!zoneElem) {
            console.warn('Zone element with id ' + component.zone + ' not found for component of type ' + component.type);
            continue;
        }
        handles.push(scheduleComponent(component, zoneElem));
    }
    return handles;
}


/**
 * Cancels all active scheduler handles rerturned by scheduleAll
 * Safe to call multiople rimes, already cancelled handles are no ops
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
        const validZones = Array.from(document.querySelectorAll('.zone')).map(el => el.id);
        const config = await loadConfig(validZones);
        document.documentElement.style.setProperty('--color-bg', config.theme?.background ?? '#111111');
        document.documentElement.style.setProperty('--color-text', config.theme?.color ?? '#ffffff');
        document.documentElement.style.setProperty('--font-family', config.theme?.fontFamily ?? 'sans-serif');
        registerComponents();
 
        // Initial render of all components
        for (const [i, component] of config.components.entries()) {
            const zoneElem = document.getElementById(component.zone);
            if (!zoneElem) {
                console.warn('Zone element with id ' + component.zone + ' not found for component of type ' + component.type);
                continue;
            }
            renderComponent(component, zoneElem, `component-${i}`);
        }
 
        // Hand off components that need periodic refresh to the scheduler
        scheduleAll(config.components);
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

export { loadConfig, 
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
    scheduleAll,
    cancelAll,
    renderComponent,
};