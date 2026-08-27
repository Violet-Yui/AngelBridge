import { createStore } from './src/state.js';
import { renderApp } from './src/views.js';
import { applyRoute, routeFromState } from './src/router.js';

const root = document.querySelector('#app');
const store = createStore();
let toastTimer;
let applyingBrowserRoute = false;
function render() {
  root.innerHTML = renderApp(store.getState());
  if (store.getState().toast) { clearTimeout(toastTimer); toastTimer = setTimeout(() => store.dispatch({type:'CLEAR_TOAST'}), 2200); }
}
store.subscribe(render);
if (location.hash) applyRoute(store, location.hash);
else history.replaceState(null, '', routeFromState(store.getState()));
render();

function navigate(action, {replace=false} = {}) {
  store.dispatch(action);
  const route = routeFromState(store.getState());
  if (route !== location.hash) history[replace ? 'replaceState' : 'pushState'](null, '', route);
}

window.addEventListener('hashchange', () => {
  if (applyingBrowserRoute) return;
  applyingBrowserRoute = true;
  applyRoute(store, location.hash);
  applyingBrowserRoute = false;
});

root.addEventListener('click', event => {
  const target = event.target.closest('button,[data-item-id]');
  if (!target) return;
  if (target.dataset.channel) return navigate({type:'SET_CHANNEL',channel:target.dataset.channel});
  if (target.dataset.pet) return store.dispatch({type:'SELECT_PET',petId:target.dataset.pet});
  if (target.dataset.itemId) return navigate({type:'OPEN_ITEM',itemId:target.dataset.itemId});
  if (target.dataset.tab) {
    if (target.dataset.tab === 'create') return store.dispatch({type:'OPEN_OVERLAY',overlay:{type:'create'}});
    return navigate({type:'SET_TAB',tab:target.dataset.tab});
  }
  const action = target.dataset.action;
  if (action === 'back') {
    if (history.length > 1) return history.back();
    return navigate({type:'CLOSE_ITEM'},{replace:true});
  }
  if (action === 'dismiss') return store.dispatch({type:'CLOSE_OVERLAY'});
  if (action === 'connect') return store.dispatch({type:'OPEN_OVERLAY',overlay:{type:'connect',itemId:target.dataset.item}});
  if (action === 'confirm-connect') return store.dispatch({type:'CONNECT',itemId:target.dataset.item});
  if (action === 'tree') return navigate({type:'SET_TAB',tab:'tree'});
  if (action === 'pet') return navigate({type:'SET_TAB',tab:'pet'});
  if (action === 'search') return store.dispatch({type:'SHOW_TOAST',message:'搜索将在下一阶段接入'});
  if (action === 'notify' || action === 'coming' || action === 'my-posts') return store.dispatch({type:'SHOW_TOAST',message:'演示版本暂未开放'});
});

root.addEventListener('submit', event => {
  if (event.target.id !== 'create-form') return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target));
  store.dispatch({type:'CREATE_ITEM',payload:values});
});

document.addEventListener('keydown', event => { if (event.key === 'Escape') store.dispatch({type:'CLOSE_OVERLAY'}); });
