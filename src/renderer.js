// ============================================================
// CONFIG LOADER
// Fetches and validates config.json
// Rejects on missing required fields
// ============================================================



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



// ============================================================
// SCHEDULER
// Handles per-component refresh intervals
// Uses setInterval, respects component.refresh field
// ============================================================



// ============================================================
// BOOTSTRAP
// Entry point - wires everything together
// Runs on DOMContentLoaded
// ============================================================