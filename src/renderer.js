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
    const requiredFields = {
        image: ['src', 'alt'],
        rss: ['url']
    };
    const errors = [];

    // Validate config.layout field
    if (!config.layout) {
        errors.push("Missing required field: layout");
    } else if (!Array.isArray(config.layout.zones) || config.layout.zones.length === 0) {
        errors.push("layout.zones must be a non-empty array");
    } else {
        const invalidZones = config.layout.zones.filter(zone => !validZones.includes(zone));
        if (invalidZones.length > 0) {
            errors.push(`Invalid zones: ${invalidZones.join(', ')}`);
        }
    } 

    // Validate config.components field
    if (!config.components) {
        errors.push("Missing required field: components");
    } else if (!Array.isArray(config.components) || config.components.length === 0) {
        errors.push("config.components must be a non-empty array");
    } else {
        for (const component of config.components) {
            const type = component.type;
            if (!type) {
                errors.push("Each component must have a type field");
            } else if (!requiredFields[type]) {
                errors.push(`Unknown component type: ${type}`);
            } else {
                const missingFields = requiredFields[type].filter(field => !component[field]); 
                if (missingFields.length > 0) {
                    errors.push(`Component of type ${type} is missing required fields: ${missingFields.join(', ')}`);
                }
            }
            if (!component.zone) {
                errors.push(`Each component must have a zone field`);
            } else if (!validZones.includes(component.zone)) {
                errors.push(`Each component must have a valid zone: ${component.zone} is an invalid zone`);
            }
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join("\n"));
    }
}

// ============================================================
// COMPONENT REGISTRY
// Map of type -> builder function
// Register all component types here
// ============================================================



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

export { loadConfig, validateConfig };