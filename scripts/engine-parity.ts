import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { generatePrediction } from '../src/engine/adaptiveEngine';
import { auditAndCalibrate } from '../src/engine/smartCalibrator';
import { compareSnapshots, diagnosticSnapshot, DIAGNOSTIC_ENGINE_VERSION } from '../src/engine/engineParity';

const args = process.argv.slice(2);
const option = (key: string, fallback: string) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const backend = resolve(option('--backend', '../newera'));
mkdirSync('work', { recursive: true });
const input = resolve('work/parity-python.json');
execFileSync(process.env.PYTHON || 'python', [resolve(backend, 'scripts/export_parity.py'), '--output', input], { stdio: 'inherit' });
const bundle = JSON.parse(readFileSync(input, 'utf8'));
const cases: any[] = [];
const canonical = (v: any): string => JSON.stringify(v, (_k, value) => typeof value === 'number' ? Number(value.toFixed(8)) : value);
const digest = (v: any) => createHash('sha256').update(canonical(v)).digest('hex');
for (const fixture of bundle.cases) {
  let previous: any;
  for (const [index, step] of fixture.steps.entries()) {
    for (const mode of ['shared-state', 'independent-lifecycle']) {
      const audit = auditAndCalibrate(step.history, mode === 'shared-state' ? step.previous_prediction : previous);
      const p = generatePrediction(step.history, audit);
      if (!audit || !p) throw new Error(`Engine failed: ${fixture.id}/${index}`);
      const ts = diagnosticSnapshot(p, audit);
      if (mode === 'independent-lifecycle') previous = {
        ...Object.fromEntries(Object.entries(ts.ai_digits).map(([k, v]) => [`ai${k}`, v])),
        ...Object.fromEntries(Object.entries(ts.bbfs_digits).map(([k, v]) => [`bbfs${k}`, v])),
        tier_method_weights: ts.method_weights, bbfs_tier_weights: ts.factor_weights,
        dead_digits: ts.dead_digits, paito: ts.paito
      };
      cases.push({ fixture: fixture.id, drawCount: step.history.length, mode, python_digest: digest(step.python), typescript_digest: digest(ts), ...compareSnapshots(step.python, ts) });
    }
  }
}
const summary = Object.fromEntries(['shared-state', 'independent-lifecycle'].map(mode => {
  const subset = cases.filter(c => c.mode === mode);
  const groups: Record<string, any> = {};
  for (const c of subset) for (const [key, g] of Object.entries(c.groups) as [string, any][]) {
    const row = groups[key] ??= { snapshots: 0, divergentSnapshots: 0, comparedFields: 0, differingFields: 0, maxAbsoluteDelta: 0 };
    row.snapshots++; row.divergentSnapshots += Number(g.differing > 0); row.comparedFields += g.compared; row.differingFields += g.differing;
    row.maxAbsoluteDelta = Math.max(row.maxAbsoluteDelta, g.maxAbsoluteDelta);
  }
  return [mode, groups];
}));
const report = { schema_version: 1, production_source: 'python', engine_version: bundle.engine_version,
  diagnostic_engine_version: DIAGNOSTIC_ENGINE_VERSION, fixtures: bundle.cases.length, comparisons: cases.length, summary, cases };
writeFileSync(option('--output', 'work/parity-report.json'), JSON.stringify(report, null, 2) + '\n');
// A reviewed divergence baseline is a regression gate, NEVER a declaration of parity.
const signature = cases.map(c => ({ fixture: c.fixture, drawCount: c.drawCount, mode: c.mode,
  python_digest: c.python_digest, typescript_digest: c.typescript_digest,
  differingFields: c.differingFields, differences_digest: digest(c.differences) }));
if (args.includes('--record-baseline')) writeFileSync('tests/fixtures/parity-baseline.json', JSON.stringify(signature, null, 2) + '\n');
else if (canonical(signature) !== canonical(JSON.parse(readFileSync('tests/fixtures/parity-baseline.json', 'utf8')))) throw new Error('Parity divergence changed. Inspect work/parity-report.json; do not auto-accept a baseline.');
console.log(JSON.stringify({ fixtures: report.fixtures, comparisons: report.comparisons, summary }, null, 2));
const drift = cases.some(c => c.status === 'DRIFT');
console.log(`Regression baseline matched. ENGINE PARITY: ${drift ? 'DRIFT (Python remains authoritative)' : 'MATCH'}`);
if (args.includes('--require-parity') && drift) process.exitCode = 1;
