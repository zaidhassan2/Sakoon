import { stressModule } from './stress.js';

/**
 * Registry of available companion modules.
 * Adding "overthinking" later requires only importing its module file and adding one entry here.
 */
export const MODULES = Object.freeze({
  [stressModule.id]: stressModule,
});

export function getModule(moduleId = 'stress') {
  return MODULES[moduleId] || stressModule;
}
