import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routeFromState } from '../src/router.js';

test('route parser maps primary mobile destinations', () => {
  assert.deepEqual(parseRoute('#/channel/%E9%97%B2%E7%BD%AE'), { type:'channel', channel:'闲置' });
  assert.deepEqual(parseRoute('#/messages'), { type:'tab', tab:'messages' });
  assert.deepEqual(parseRoute('#/agent'), { type:'tab', tab:'pet' });
  assert.deepEqual(parseRoute('#/item/job-ai'), { type:'item', itemId:'job-ai' });
});

test('current state can be converted to a durable URL', () => {
  assert.equal(routeFromState({activeTab:'home',activeChannel:'找工作',selectedItemId:null}), '#/channel/%E6%89%BE%E5%B7%A5%E4%BD%9C');
  assert.equal(routeFromState({activeTab:'profile',activeChannel:'热门',selectedItemId:null}), '#/profile');
  assert.equal(routeFromState({activeTab:'home',activeChannel:'热门',selectedItemId:'hot-team'}), '#/item/hot-team');
});
