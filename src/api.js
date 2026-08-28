export const API_ENDPOINTS = Object.freeze({
  feed:'/feed', profile:'/profile', messages:'/messages', connections:'/connections',
  posts:'/posts', agentStyle:'/profile/agent-style', mediaUpload:'/media/uploads', mediaGenerate:'/media/generate'
});

export function createApiClient({baseUrl='/api',fetchImpl=globalThis.fetch} = {}) {
  const request = async (path, options={}) => {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const response = await fetchImpl(`${baseUrl.replace(/\/$/,'')}${path}`, {
      ...options,
      headers:{Accept:'application/json',...(isFormData ? {} : {'Content-Type':'application/json'}),...(options.headers||{})}
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
    uploadPostImage: file => { const body=new FormData(); body.append('file',file); return request(API_ENDPOINTS.mediaUpload,{method:'POST',body}); },
    generatePostImage: payload => request(API_ENDPOINTS.mediaGenerate,{method:'POST',body:JSON.stringify(payload)}),
    updatePostImage: (postId,imageUrl,source='ai-generated') => request(`${API_ENDPOINTS.posts}/${encodeURIComponent(postId)}/image`,{method:'PATCH',body:JSON.stringify({imageUrl,source})}),
    selectAgentStyle: styleId => request(API_ENDPOINTS.agentStyle,{method:'PUT',body:JSON.stringify({styleId})})
  };
}

export const api = createApiClient({
  baseUrl:globalThis.ANGELBRIDGE_API_BASE || '/api'
});
