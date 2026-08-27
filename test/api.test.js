import test from 'node:test';
import assert from 'node:assert/strict';
import { API_ENDPOINTS, createApiClient } from '../src/api.js';

test('backend API contract reserves core UX operations', () => {
  for (const key of ['feed','profile','messages','connections','posts','agentStyle','mediaUpload','mediaGenerate']) assert.ok(API_ENDPOINTS[key]);
});

test('API client prefixes requests with configurable backend base', async () => {
  let request;
  const fetchImpl = async (url, options) => { request={url,options}; return {ok:true,status:200,json:async()=>({ok:true})}; };
  const api = createApiClient({baseUrl:'http://localhost:3000/api',fetchImpl});
  await api.getFeed('闲置');
  assert.equal(request.url, 'http://localhost:3000/api/feed?channel=%E9%97%B2%E7%BD%AE');
  assert.equal(request.options.headers.Accept, 'application/json');
});

test('API client reserves upload generation and post-image update calls', async () => {
  const requests=[];
  const fetchImpl = async (url,options) => { requests.push({url,options}); return {ok:true,status:200,json:async()=>({imageUrl:'https://cdn.test/image.jpg'})}; };
  const api = createApiClient({baseUrl:'/api',fetchImpl});
  await api.generatePostImage({postId:'p1',title:'找工作'});
  await api.updatePostImage('p1','https://cdn.test/image.jpg');
  assert.equal(requests[0].url,'/api/media/generate');
  assert.equal(requests[1].url,'/api/posts/p1/image');
  assert.equal(requests[1].options.method,'PATCH');
});
