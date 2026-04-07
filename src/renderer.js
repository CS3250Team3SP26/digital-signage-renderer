// ============================================================
// CONFIG LOADER
// Fetches and validates config.json
// Rejects on missing required fields
// ============================================================
/**
 * Loads the configuration from config.json
 * @returns {Promise<Object>} The loaded configuration object
 * @throws {Error} If there is an error fetching the config.json file
 * @throws {Error} If there is an error parsing the json file
 */
async function loadConfig() {
    const response = await fetch('./config.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    try {
        return await response.json();
    } catch {
        throw new Error("config.json contains invalid JSON - check for syntax errors");
    }
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
    } else if (!REQUIRED_COMPONENT_FIELDS[type]) {
        errors.push(`Unknown component type: ${type}`);
    } else {
        const missingFields = REQUIRED_COMPONENT_FIELDS[type].filter(field => !component[field]); 
        if (missingFields.length > 0) {
            errors.push(`Component of type ${type} is missing required fields: ${missingFields.join(', ')}`);
        }
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

const REQUIRED_COMPONENT_FIELDS = {
    image: ['src', 'alt'],
    rss: ['url']
};

/**
 * Registers all component types with their corresponding builder functions
 * This function should be called during the bootstrap phase to ensure all components are available for rendering
 * To add a new component type, simply call registerComponent with the type string and the builder function that creates the DOM element for that component
 */
/* istanbul ignore next */
// eslint-disable-next-line no-unused-vars
function registerComponents() {
    // To register a new component add it below
    // ex. registerComponent('type', buildType)
    // registerComponent('rss', buildRss);
    // registerComponent('image', buildImage);
}

/**
 * Registers a component type with its corresponding builder function
 * @param {String} type The component type to register
 * @param {Function} buildType The function that creates the DOM element for the component
 * @throws {Error} If the type is not a string or the buildType is not a function
 */
function registerComponent(type, buildType) {
    if (typeof type !== 'string') {
        throw new Error(`Type must be a string`);
    }
    if (typeof buildType !== 'function') {
        throw new Error(`Builder function for type ${type} is not a function`);
    }
    registry.set(type, buildType);
}

/**
 * Retrieves the builder function for a given component type from the registry
 * @param {String} type The component type to retrieve
 * @returns {Function} The builder function for the specified component type
 * @throws {Error} If the type is not a string or the builder function is not found
 */
function getComponent(type) {
    if (typeof type !== 'string') {
        throw new Error(`Type must be a string`);
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
function buildImage(component){
    const img = document.createElement('img');
    img.setAttribute('src', component.src);
    img.setAttribute('alt', component.alt);
    return img;
}



// ============================================================
// SCHEDULER
// Handles per-component refresh intervals
// Uses setInterval, respects component.refresh field
// ============================================================
/* istanbul ignore next */



// ============================================================
// BOOTSTRAP
// Entry point - wires everything together
// Runs on DOMContentLoaded
// ============================================================
/* istanbul ignore next */

export { loadConfig, validateConfig, registerComponent, getComponent, buildImage };
