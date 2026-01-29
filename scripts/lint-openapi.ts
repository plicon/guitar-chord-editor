import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as openApiModule from '../worker/src/openapi';

const moduleValue = openApiModule as {
	openApiSpec?: unknown;
	default?: unknown;
};

let openApiSpec = moduleValue.openApiSpec ?? moduleValue.default;
if (openApiSpec && typeof openApiSpec === 'object' && 'openApiSpec' in openApiSpec) {
	openApiSpec = (openApiSpec as { openApiSpec?: unknown }).openApiSpec;
}

if (!openApiSpec) {
	throw new Error('Failed to load OpenAPI spec from worker/src/openapi.ts');
}

const outputPath = resolve(process.cwd(), '.tmp/openapi.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2), 'utf-8');
console.log(`OpenAPI spec written to ${outputPath}`);
