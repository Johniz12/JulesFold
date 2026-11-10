const path = require('path');
const fs = require('fs');

const SUPPORTED_AMCS_VERSIONS = ['1.0'];
const SUPPORTED_CAPABILITIES = ['notifications', 'events'];
const SUPPORTED_LIFECYCLE_POLICIES = ['keep-alive', 'terminate'];
const SUPPORTED_RUNTIMES = ['web'];

/**
 * Validates an AMCS v1 manifest object.
 *
 * @param {object} manifest - Parsed manifest content
 * @param {string} moduleDirPath - Absolute path of module root directory
 * @returns {{ valid: boolean, errors: string[], manifest?: object }}
 */
function validateManifest(manifest, moduleDirPath) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be a non-null JSON object'] };
  }

  // 1. Required fields
  const requiredFields = [
    'id',
    'name',
    'version',
    'amcsVersion',
    'description',
    'entry',
    'runtime',
    'window',
    'capabilities',
    'lifecycle',
  ];

  for (const field of requiredFields) {
    if (manifest[field] === undefined || manifest[field] === null || manifest[field] === '') {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // 2. Validate id format
  if (typeof manifest.id !== 'string' || !/^[a-z0-9-_]+$/.test(manifest.id)) {
    errors.push('Field "id" must be a lowercase alphanumeric string with optional dashes/underscores');
  }

  // 3. Validate AMCS version
  if (!SUPPORTED_AMCS_VERSIONS.includes(String(manifest.amcsVersion))) {
    errors.push(`Unsupported amcsVersion: "${manifest.amcsVersion}". Supported: ${SUPPORTED_AMCS_VERSIONS.join(', ')}`);
  }

  // 4. Validate runtime
  if (!SUPPORTED_RUNTIMES.includes(manifest.runtime)) {
    errors.push(`Unsupported runtime: "${manifest.runtime}". Supported: ${SUPPORTED_RUNTIMES.join(', ')}`);
  }

  // 5. Validate window configuration
  const win = manifest.window;
  if (!win || typeof win !== 'object') {
    errors.push('Field "window" must be an object');
  } else {
    if (typeof win.width !== 'number' || win.width <= 0) {
      errors.push('Field "window.width" must be a positive number');
    }
    if (typeof win.height !== 'number' || win.height <= 0) {
      errors.push('Field "window.height" must be a positive number');
    }
    if (win.minWidth !== undefined && (typeof win.minWidth !== 'number' || win.minWidth <= 0)) {
      errors.push('Field "window.minWidth" must be a positive number');
    }
    if (win.minHeight !== undefined && (typeof win.minHeight !== 'number' || win.minHeight <= 0)) {
      errors.push('Field "window.minHeight" must be a positive number');
    }
    if (win.minWidth && win.width && win.width < win.minWidth) {
      errors.push('Field "window.width" cannot be less than "window.minWidth"');
    }
    if (win.minHeight && win.height && win.height < win.minHeight) {
      errors.push('Field "window.height" cannot be less than "window.minHeight"');
    }
  }

  // 6. Validate capabilities
  if (!Array.isArray(manifest.capabilities)) {
    errors.push('Field "capabilities" must be an array of strings');
  } else {
    for (const cap of manifest.capabilities) {
      if (!SUPPORTED_CAPABILITIES.includes(cap)) {
        errors.push(`Unsupported capability requested: "${cap}". Supported: ${SUPPORTED_CAPABILITIES.join(', ')}`);
      }
    }
  }

  // 7. Validate lifecycle
  const lc = manifest.lifecycle;
  if (!lc || typeof lc !== 'object') {
    errors.push('Field "lifecycle" must be an object');
  } else {
    const closePolicy = lc.close || 'keep-alive';
    if (!SUPPORTED_LIFECYCLE_POLICIES.includes(closePolicy)) {
      errors.push(`Unsupported lifecycle close policy: "${closePolicy}". Supported: ${SUPPORTED_LIFECYCLE_POLICIES.join(', ')}`);
    }
    const hidePolicy = lc.hide || 'keep-alive';
    if (!SUPPORTED_LIFECYCLE_POLICIES.includes(hidePolicy)) {
      errors.push(`Unsupported lifecycle hide policy: "${hidePolicy}". Supported: ${SUPPORTED_LIFECYCLE_POLICIES.join(', ')}`);
    }
  }

  // 8. Prevent path traversal and verify entry file exists inside module directory
  if (moduleDirPath && typeof manifest.entry === 'string') {
    const resolvedEntry = path.resolve(moduleDirPath, manifest.entry);
    const resolvedDir = path.resolve(moduleDirPath);
    if (!resolvedEntry.startsWith(resolvedDir + path.sep)) {
      errors.push(`Security violation: entry path "${manifest.entry}" escapes module directory`);
    } else if (!fs.existsSync(resolvedEntry)) {
      errors.push(`Entry file does not exist: "${manifest.entry}" at "${resolvedEntry}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    manifest: errors.length === 0 ? manifest : undefined,
  };
}

module.exports = {
  validateManifest,
  SUPPORTED_AMCS_VERSIONS,
  SUPPORTED_CAPABILITIES,
  SUPPORTED_LIFECYCLE_POLICIES,
  SUPPORTED_RUNTIMES,
};
