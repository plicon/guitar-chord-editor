/**
 * Worker version configuration
 * 
 * This version is read from package.json to ensure consistency
 * between the frontend and API versions.
 * 
 * NOTE: To update the version, change it in worker/package.json
 */

import packageJson from '../../package.json';

export const WORKER_VERSION = packageJson.version;
