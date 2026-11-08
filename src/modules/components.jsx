import React from 'react';
import DemoClock from './demo-clock/DemoClock.jsx';
import './demo-clock/demo-clock.css';

/**
 * Component Resolver for Registered Modules
 */
const MODULE_COMPONENTS = {
  'demo-clock': DemoClock,
};

export function getModuleComponent(id) {
  return MODULE_COMPONENTS[id] || null;
}
