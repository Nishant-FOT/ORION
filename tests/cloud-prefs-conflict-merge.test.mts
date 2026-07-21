import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mergeCloudWithLocalDirty, settledDirtyKeys } from '../src/utils/cloud-prefs-migrations.ts';

describe('mergeCloudWithLocalDirty', () => {
  it('with no dirty keys, returns the cloud blob verbatim (string values only)', () => {
    const cloud = { 'orion-theme': 'dark', 'orion-market-watchlist-v1': '["AAPL"]' };
    const local = { 'orion-theme': 'light', 'orion-market-watchlist-v1': '["TSLA"]' };
    assert.deepEqual(mergeCloudWithLocalDirty(cloud, local, []), cloud);
  });

  it('a dirty key present locally wins over the cloud value', () => {
    const cloud = { 'orion-market-watchlist-v1': '["AAPL"]', 'orion-theme': 'dark' };
    const local = { 'orion-market-watchlist-v1': '["GLW","LLY","ENTG"]', 'orion-theme': 'dark' };
    const merged = mergeCloudWithLocalDirty(cloud, local, ['orion-market-watchlist-v1']);
    assert.equal(merged['orion-market-watchlist-v1'], '["GLW","LLY","ENTG"]');
    // non-dirty key still takes the cloud value
    assert.equal(merged['orion-theme'], 'dark');
  });

  it('REGRESSION: the just-typed local watchlist survives a 409 conflict', () => {
    // The reported bug: user types 7 tickers, the debounced upload 409s, and
    // the old conflict path overwrote localStorage with the cloud blob —
    // losing all 7. The merge must keep them.
    const cloudData = { 'orion-market-watchlist-v1': '[]' }; // stale cloud row
    const localBlob = { 'orion-market-watchlist-v1': '["GLW","LLY","ENTG","FLNC","KULR","ONDS","QCOM"]' };
    const merged = mergeCloudWithLocalDirty(cloudData, localBlob, ['orion-market-watchlist-v1']);
    assert.equal(
      merged['orion-market-watchlist-v1'],
      '["GLW","LLY","ENTG","FLNC","KULR","ONDS","QCOM"]',
    );
  });

  it('a dirty key removed locally is dropped from the merge', () => {
    // User reset the watchlist (removeItem) — the key is dirty but absent
    // from localBlob. The merge must NOT resurrect the cloud value.
    const cloud = { 'orion-market-watchlist-v1': '["AAPL"]', 'orion-theme': 'dark' };
    const local = { 'orion-theme': 'dark' }; // watchlist removed locally
    const merged = mergeCloudWithLocalDirty(cloud, local, ['orion-market-watchlist-v1']);
    assert.equal('orion-market-watchlist-v1' in merged, false);
    assert.equal(merged['orion-theme'], 'dark');
  });

  it('a concurrent change on a non-dirty key survives (cloud wins for keys we did not touch)', () => {
    // Cloud advanced because another device changed the theme; locally we
    // only touched the watchlist. Both changes must survive the merge.
    const cloud = { 'orion-theme': 'light', 'orion-market-watchlist-v1': '["AAPL"]' };
    const local = { 'orion-theme': 'dark', 'orion-market-watchlist-v1': '["TSLA"]' };
    const merged = mergeCloudWithLocalDirty(cloud, local, ['orion-market-watchlist-v1']);
    assert.equal(merged['orion-theme'], 'light'); // other device's change kept
    assert.equal(merged['orion-market-watchlist-v1'], '["TSLA"]'); // our change kept
  });

  it('a dirty key that exists only locally is included', () => {
    const cloud = { 'orion-theme': 'dark' };
    const local = { 'orion-theme': 'dark', 'orion-market-watchlist-v1': '["TSLA"]' };
    const merged = mergeCloudWithLocalDirty(cloud, local, ['orion-market-watchlist-v1']);
    assert.equal(merged['orion-market-watchlist-v1'], '["TSLA"]');
  });

  it('drops non-string cloud values', () => {
    const cloud = { 'orion-theme': 'dark', 'orion-bogus': 42, 'orion-nullish': null } as Record<string, unknown>;
    const merged = mergeCloudWithLocalDirty(cloud, {}, []);
    assert.deepEqual(merged, { 'orion-theme': 'dark' });
  });

  it('does not mutate its inputs', () => {
    const cloud = { 'orion-theme': 'dark' };
    const local = { 'orion-theme': 'light' };
    const cloudCopy = { ...cloud };
    const localCopy = { ...local };
    mergeCloudWithLocalDirty(cloud, local, ['orion-theme']);
    assert.deepEqual(cloud, cloudCopy);
    assert.deepEqual(local, localCopy);
  });
});

describe('settledDirtyKeys', () => {
  it('a dirty key whose posted value still matches local is settled', () => {
    const posted = { 'orion-market-watchlist-v1': '["GLW"]' };
    const local = { 'orion-market-watchlist-v1': '["GLW"]' };
    assert.deepEqual(settledDirtyKeys(posted, local, ['orion-market-watchlist-v1']), ['orion-market-watchlist-v1']);
  });

  it('a dirty key changed mid-flight (posted != current local) stays dirty', () => {
    const posted = { 'orion-market-watchlist-v1': '["GLW"]' };
    const local = { 'orion-market-watchlist-v1': '["GLW","LLY"]' }; // user typed more during the POST
    assert.deepEqual(settledDirtyKeys(posted, local, ['orion-market-watchlist-v1']), []);
  });

  it('REGRESSION: a key dirtied mid-flight and absent from the posted blob stays dirty', () => {
    // The race the reviewer flagged: postCloudPrefs({watchlist}) is in flight,
    // the user changes the theme. A blanket _dirtyKeys.clear() would drop
    // 'orion-theme' even though it was never posted — then a later 409
    // would clobber it. settledDirtyKeys must keep it.
    const posted = { 'orion-market-watchlist-v1': '["GLW","LLY","ENTG"]' };
    const local = { 'orion-market-watchlist-v1': '["GLW","LLY","ENTG"]', 'orion-theme': 'light' };
    const settled = settledDirtyKeys(posted, local, ['orion-market-watchlist-v1', 'orion-theme']);
    assert.deepEqual(settled, ['orion-market-watchlist-v1']); // theme NOT settled
  });

  it('a synced removal settles (posted absent + local absent)', () => {
    const posted = { 'orion-theme': 'dark' }; // watchlist removed → not in posted blob
    const local = { 'orion-theme': 'dark' };  // still absent locally
    assert.deepEqual(settledDirtyKeys(posted, local, ['orion-market-watchlist-v1']), ['orion-market-watchlist-v1']);
  });

  it('a key removed-then-re-added mid-flight stays dirty', () => {
    const posted = { 'orion-theme': 'dark' }; // posted as removed
    const local = { 'orion-theme': 'dark', 'orion-market-watchlist-v1': '["TSLA"]' }; // re-added during POST
    assert.deepEqual(settledDirtyKeys(posted, local, ['orion-market-watchlist-v1']), []);
  });

  it('only considers keys in the dirty set', () => {
    // A non-dirty key that happens to differ between posted and local must
    // never be returned — we only ever clear keys we were tracking.
    const posted = { 'orion-theme': 'dark' };
    const local = { 'orion-theme': 'light' };
    assert.deepEqual(settledDirtyKeys(posted, local, []), []);
  });
});
