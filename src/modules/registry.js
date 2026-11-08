/**
 * Static Module Registry for ALFRED Host
 * Separates module definitions and registration helpers so they can be tested
 * and referenced cleanly across environments.
 */

// Registry entry descriptors without bundling UI component directly in metadata
export const MODULE_REGISTRY = [
  {
    id: 'demo-clock',
    name: 'Precision Chrono',
    description: 'Real-time multi-timezone digital clock with 12/24h toggle & session uptime.',
    version: '1.0.0',
    category: 'Utilities',
    icon: 'clock',
    componentPath: './demo-clock/DemoClock.jsx',
    defaultActive: true,
    canBeWidget: true,
    canBeWindow: true,
    minWidth: 320,
    minHeight: 280,
  },
];

/**
 * Helper to retrieve all registered module descriptors
 */
export function getAllModules() {
  return [...MODULE_REGISTRY];
}

/**
 * Helper to retrieve a single module descriptor by id
 */
export function getModuleById(id) {
  return MODULE_REGISTRY.find((mod) => mod.id === id) || null;
}

/**
 * Validates whether a module object satisfies the compatibility contract
 */
export function validateModuleContract(moduleDef) {
  if (!moduleDef || typeof moduleDef !== 'object') {
    return { valid: false, error: 'Module definition must be a valid object' };
  }
  const requiredFields = ['id', 'name', 'description'];
  for (const field of requiredFields) {
    if (!moduleDef[field]) {
      return { valid: false, error: `Missing required module field: "${field}"` };
    }
  }
  if (!moduleDef.component && !moduleDef.componentPath) {
    return { valid: false, error: 'Module must provide either "component" or "componentPath"' };
  }
  if (typeof moduleDef.id !== 'string' || !/^[a-z0-9-_]+$/.test(moduleDef.id)) {
    return { valid: false, error: 'Module id must be lowercase alphanumeric string' };
  }
  return { valid: true };
}
