import { createStore } from './src/state.js';
import { renderApp } from './src/views.js';
import { applyRoute, routeFromState } from './src/router.js';

const root = document.querySelector('#app');
const store = createStore();
let toastTimer;
let applyingBrowserRoute = false;
let pendingPostImage = null;
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
  if (action === 'dismiss') { pendingPostImage = null; return store.dispatch({type:'CLOSE_OVERLAY'}); }
  if (action === 'connect') return store.dispatch({type:'OPEN_OVERLAY',overlay:{type:'connect',itemId:target.dataset.item}});
  if (action === 'confirm-connect') return store.dispatch({type:'CONNECT',itemId:target.dataset.item});
  if (action === 'tree') return navigate({type:'SET_CHANNEL',channel:'人生树'});
  if (action === 'pet') return navigate({type:'SET_TAB',tab:'pet'});
  if (action === 'search') return store.dispatch({type:'SHOW_TOAST',message:'搜索将在下一阶段接入'});
  if (action === 'notify' || action === 'coming' || action === 'my-posts') return store.dispatch({type:'SHOW_TOAST',message:'演示版本暂未开放'});
});

function readAndResizeImage(file) {
  return new Promise((resolve,reject) => {
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('无法读取照片'));
    reader.onload=()=>{ const image=new Image(); image.onerror=()=>reject(new Error('照片格式不受支持')); image.onload=()=>{
      const scale=Math.min(1,1280/Math.max(image.width,image.height));
      const canvas=document.createElement('canvas'); canvas.width=Math.round(image.width*scale); canvas.height=Math.round(image.height*scale);
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      resolve(canvas.toDataURL('image/jpeg',.82));
    }; image.src=reader.result; };
    reader.readAsDataURL(file);
  });
}

root.addEventListener('change', async event => {
  if (event.target.id !== 'post-image') return;
  const file=event.target.files?.[0];
  if (!file) return;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10*1024*1024) return store.dispatch({type:'SHOW_TOAST',message:'请选择 10MB 内的 JPG、PNG 或 WebP 照片'});
  try {
    pendingPostImage=await readAndResizeImage(file);
    const preview=root.querySelector('#post-image-preview');
    if (preview) preview.innerHTML=`<img src="${pendingPostImage}" alt="发布照片预览"><span>${file.name}</span>`;
  } catch (error) { store.dispatch({type:'SHOW_TOAST',message:error.message}); }
});

root.addEventListener('submit', event => {
  if (event.target.id !== 'create-form') return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target));
  delete values.imageFile;
  if (pendingPostImage) { values.image=pendingPostImage; values.imageSource='user-upload'; }
  else values.imageSource='matched-placeholder';
  store.dispatch({type:'CREATE_ITEM',payload:values});
  pendingPostImage=null;
});

document.addEventListener('keydown', event => { if (event.key === 'Escape') store.dispatch({type:'CLOSE_OVERLAY'}); });
