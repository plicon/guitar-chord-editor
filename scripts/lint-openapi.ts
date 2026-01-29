import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { openApiSpec } from '../worker/src/openapi';

const outputPath = resolve(process.cwd(), '.tmp/openapi.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2), 'utf-8');
console.log(`OpenAPI spec written to ${outputPath}`);
