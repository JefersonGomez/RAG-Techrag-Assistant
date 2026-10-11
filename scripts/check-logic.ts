// scripts/check-logic.ts — verificación rápida sin red: npx tsx scripts/check-logic.ts
import assert from 'assert';
import { parseFilters } from '../src/retriver';
import { isIndexable } from '../src/ingestion';

assert.deepStrictEqual(parseFilters({ type: 'code' }), { type: 'code' });
assert.strictEqual(parseFilters(undefined), undefined);
assert.throws(() => parseFilters({ "x' OR 1=1 --": 'a' }));
assert.throws(() => parseFilters({ type: 1 }));
assert.throws(() => parseFilters(['a']));

assert.ok(isIndexable('src/db.ts'));
assert.ok(isIndexable('README.md'));
assert.ok(!isIndexable('node_modules/x/index.js'));
assert.ok(isIndexable('src/components/Hero.jsx'));
assert.ok(isIndexable('package.json'));
assert.ok(isIndexable('.github/workflows/deploy.yml'));
assert.ok(isIndexable('cmd/main.go'));
assert.ok(!isIndexable('.vscode/settings.json'));
assert.ok(!isIndexable('web/package-lock.json'));
assert.ok(!isIndexable('image.png'));

console.log('✅ check-logic OK');
process.exit(0);
