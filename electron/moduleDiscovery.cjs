const fs = require('fs');
const path = require('path');
const { validateManifest } = require('./manifestValidator.cjs');

const MANIFEST_FILENAME = 'alfred.module.json';

class ModuleDiscoveryEngine {
  constructor(modulesRootDir) {
    this.modulesRootDir = path.resolve(modulesRootDir);
    this.registeredModules = new Map();
    this.discoveryErrors = [];
  }

  discoverModules() {
    this.registeredModules.clear();
    this.discoveryErrors = [];

    if (!fs.existsSync(this.modulesRootDir)) {
      return [];
    }

    const entries = fs.readdirSync(this.modulesRootDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const moduleDirPath = path.join(this.modulesRootDir, entry.name);
      const manifestPath = path.join(moduleDirPath, MANIFEST_FILENAME);

      if (!fs.existsSync(manifestPath)) {
        continue;
      }

      try {
        const rawContent = fs.readFileSync(manifestPath, 'utf8');
        let parsed;
        try {
          parsed = JSON.parse(rawContent);
        } catch (jsonErr) {
          this.discoveryErrors.push({
            dir: entry.name,
            error: `Invalid JSON in ${MANIFEST_FILENAME}: ${jsonErr.message}`,
          });
          continue;
        }

        const validation = validateManifest(parsed, moduleDirPath);
        if (!validation.valid) {
          this.discoveryErrors.push({
            dir: entry.name,
            error: `Manifest validation failed: ${validation.errors.join(', ')}`,
          });
          continue;
        }

        if (this.registeredModules.has(parsed.id)) {
          this.discoveryErrors.push({
            dir: entry.name,
            error: `Duplicate module ID "${parsed.id}" already registered from ${this.registeredModules.get(parsed.id).moduleDirPath}`,
          });
          continue;
        }

        const fullEntryPath = path.resolve(moduleDirPath, parsed.entry);

        const moduleRegistration = {
          ...parsed,
          moduleDirPath,
          manifestPath,
          fullEntryPath,
          status: 'registered',
        };

        this.registeredModules.set(parsed.id, moduleRegistration);
      } catch (err) {
        this.discoveryErrors.push({
          dir: entry.name,
          error: `Unexpected read failure: ${err.message}`,
        });
      }
    }

    return this.getAllRegisteredModules();
  }

  getModule(id) {
    return this.registeredModules.get(id) || null;
  }

  getAllRegisteredModules() {
    return Array.from(this.registeredModules.values());
  }

  getDiscoveryErrors() {
    return [...this.discoveryErrors];
  }
}

module.exports = {
  ModuleDiscoveryEngine,
  MANIFEST_FILENAME,
};
