export const API_ENDPOINTS = Object.freeze({
  feed:'/feed', profile:'/profile', messages:'/messages', connections:'/connections',
  posts:'/posts', agentStyle:'/profile/agent-style'
});

export function createApiClient({baseUrl='/api',fetchImpl=globalThis.fetch} = {}) {
  const request = async (path, options={}) => {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/,'')}${path}`, {
      ...options,
      headers:{Accept:'application/json','Content-Type':'application/json',...(options.headers||{})}
    });
    if (!response.ok) throw new Error(`API request failed (${response.status})`);
    return response.status === 204 ? null : response.json();
  };
  return {
    getFeed: channel => request(`${API_ENDPOINTS.feed}?channel=${encodeURIComponent(channel)}`),
    getProfile: () => request(API_ENDPOINTS.profile),
    getMessages: () => request(API_ENDPOINTS.messages),
    createConnection: itemId => request(API_ENDPOINTS.connections,{method:'POST',body:JSON.stringify({itemId})}),
    createPost: payload => request(API_ENDPOINTS.posts,{method:'POST',body:JSON.stringify(payload)}),
    selectAgentStyle: styleId => request(API_ENDPOINTS.agentStyle,{method:'PUT',body:JSON.stringify({styleId})})
  };
}

export const api = createApiClient({
  baseUrl:globalThis.ANGELBRIDGE_API_BASE || '/api'
});
