import test from 'node:test';
import assert from 'node:assert/strict';
import { API_ENDPOINTS, createApiClient } from '../src/api.js';

test('backend API contract reserves core UX operations', () => {
  for (const key of ['feed','profile','messages','connections','posts','agentStyle']) assert.ok(API_ENDPOINTS[key]);
});

test('API client prefixes requests with configurable backend base', async () => {
  let request;
  const fetchImpl = async (url, options) => { request={url,options}; return {ok:true,status:200,json:async()=>({ok:true})}; };
  const api = createApiClient({baseUrl:'http://localhost:3000/api',fetchImpl});
  await api.getFeed('闲置');
  assert.equal(request.url, 'http://localhost:3000/api/feed?channel=%E9%97%B2%E7%BD%AE');
  assert.equal(request.options.headers.Accept, 'application/json');
});
