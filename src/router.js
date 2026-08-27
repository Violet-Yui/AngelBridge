const TAB_ROUTES = { home:'home', messages:'messages', bridge:'bridge', profile:'profile', pet:'agent', tree:'tree' };
const ROUTE_TABS = Object.fromEntries(Object.entries(TAB_ROUTES).map(([tab,route]) => [route,tab]));

export function parseRoute(hash = '') {
  const path = String(hash).replace(/^#\/?/, '').split('/').filter(Boolean);
  if (path[0] === 'channel' && path[1]) return { type:'channel', channel:decodeURIComponent(path.slice(1).join('/')) };
  if (path[0] === 'item' && path[1]) return { type:'item', itemId:decodeURIComponent(path.slice(1).join('/')) };
  if (ROUTE_TABS[path[0]]) return { type:'tab', tab:ROUTE_TABS[path[0]] };
  return { type:'channel', channel:'热门' };
}

export function routeFromState(state) {
  if (state.selectedItemId) return `#/item/${encodeURIComponent(state.selectedItemId)}`;
  if (state.activeTab === 'home') return `#/channel/${encodeURIComponent(state.activeChannel || '热门')}`;
  return `#/${TAB_ROUTES[state.activeTab] || 'home'}`;
}

export function applyRoute(store, hash) {
  const route = parseRoute(hash);
  if (route.type === 'channel') store.dispatch({type:'SET_CHANNEL',channel:route.channel});
  if (route.type === 'tab') store.dispatch({type:'SET_TAB',tab:route.tab});
  if (route.type === 'item') store.dispatch({type:'OPEN_ITEM',itemId:route.itemId});
  return route;
}
