// Regression guards for src/config/map-layer-definitions.ts:
//
//   - `isLayerExecutable(key, renderer)` predicate
//
// The predicate gates whether a `layer:*` toggle (per-layer CMD+K, `layers:*`
// preset, or programmatic dispatch) is allowed to flip a layer on
// under the active renderer. Getting it wrong means toggles can set
// `mapLayers[key] = true` for layers that can't render — silent no-op
// state the user can't toggle back off if the picker hides the command
// under the current renderer.

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import {
  LAYER_REGISTRY,
  isLayerExecutable,
} from '../src/config/map-layer-definitions';

describe('LAYER_REGISTRY — renderer flags', () => {
  test('flat-only layers have correct renderer config', () => {
    assert.deepEqual(LAYER_REGISTRY.storageFacilities.renderers, ['flat']);
    assert.deepEqual(LAYER_REGISTRY.fuelShortages.renderers, ['flat']);
    assert.deepEqual(LAYER_REGISTRY.diseaseOutbreaks.renderers, ['flat']);
    assert.deepEqual(LAYER_REGISTRY.resilienceScore.renderers, ['flat']);
  });
});

describe('isLayerExecutable — renderer gate', () => {
  test('flat-only layer returns true only on flat', () => {
    assert.equal(isLayerExecutable('storageFacilities', 'flat'), true,
      'flat should execute');
    assert.equal(isLayerExecutable('storageFacilities', 'globe'), false,
      'globe mode must NOT execute (no GlobeMap render path)');
  });

  test('resilienceScore returns true on flat', () => {
    assert.equal(isLayerExecutable('resilienceScore', 'flat'), true,
      'flat should execute resilienceScore');
    assert.equal(isLayerExecutable('resilienceScore', 'globe'), false,
      'globe mode must NOT execute resilienceScore');
  });

  test('flat-only non-deckGLOnly layer returns true on flat', () => {
    assert.equal(isLayerExecutable('ciiChoropleth', 'flat'), true);
    assert.equal(isLayerExecutable('ciiChoropleth', 'globe'), false,
      'ciiChoropleth has no globe renderer');
  });

  test('dual-renderer layer admits both flat and globe', () => {
    assert.equal(isLayerExecutable('pipelines', 'flat'), true);
    assert.equal(isLayerExecutable('pipelines', 'globe'), true);
  });

  test('unknown layer key returns false', () => {
    // Typo or stale key -> must not accidentally pass the gate.
    // @ts-expect-error — intentionally passing a key outside the union
    assert.equal(isLayerExecutable('nonexistentLayer', 'flat'), false);
  });
});
