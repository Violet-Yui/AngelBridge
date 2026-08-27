import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/state.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
}

test('selected zodiac pet persists', () => {
  const storage = memoryStorage();
  createStore(storage).dispatch({ type: 'SELECT_PET', petId: '03-tiger' });
  assert.equal(createStore(storage).getState().selectedPet, '03-tiger');
});

test('connection is unique and increases growth once', () => {
  const store = createStore(memoryStorage());
  store.dispatch({ type: 'CONNECT', itemId: 'job-ai' });
  store.dispatch({ type: 'CONNECT', itemId: 'job-ai' });
  assert.equal(store.getState().connections.length, 1);
  assert.equal(store.getState().growthScore, 1020);
});

test('created item requires a title and description', () => {
  const store = createStore(memoryStorage());
  store.dispatch({ type: 'CREATE_ITEM', payload: { type: '需求', title: '', description: '测试' } });
  assert.equal(store.getState().createdItems.length, 0);
  store.dispatch({ type: 'CREATE_ITEM', payload: { type: '需求', title: '寻找摄影搭档', description: '周末一起拍摄城市故事' } });
  assert.equal(store.getState().createdItems.length, 1);
  assert.ok(store.getState().createdItems[0].match >= 80);
  assert.ok(store.getState().createdItems[0].image);
});
