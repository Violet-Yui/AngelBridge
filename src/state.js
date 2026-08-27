const STORAGE_KEY = 'angel-bridge-prototype-v1';
const initialState = {
  activeTab:'home', activeChannel:'热门', selectedPet:'04-rabbit', selectedItemId:null,
  connections:[], growthScore:1000, createdItems:[], overlay:null, toast:null
};

export function createStore(storage = globalThis.localStorage) {
  let state = { ...initialState, connections:[], createdItems:[] };
  const listeners = new Set();
  try { state = { ...state, ...JSON.parse(storage?.getItem(STORAGE_KEY) || '{}') }; } catch {}
  const persist = () => { try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} };
  const emit = () => listeners.forEach(listener => listener(state));
  const update = patch => { state = { ...state, ...patch }; persist(); emit(); };
  return {
    getState: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    reset() { state = { ...initialState, connections:[], createdItems:[] }; persist(); emit(); },
    dispatch(action) {
      switch (action.type) {
        case 'SET_TAB': update({ activeTab:action.tab, selectedItemId:null, overlay:null }); break;
        case 'SET_CHANNEL': update({ activeTab:'home', activeChannel:action.channel, selectedItemId:null }); break;
        case 'OPEN_ITEM': update({ selectedItemId:action.itemId, overlay:null }); break;
        case 'CLOSE_ITEM': update({ selectedItemId:null }); break;
        case 'OPEN_OVERLAY': update({ overlay:action.overlay }); break;
        case 'CLOSE_OVERLAY': update({ overlay:null }); break;
        case 'SELECT_PET': update({ selectedPet:action.petId, toast:'灵宠已陪你同行' }); break;
        case 'CLEAR_TOAST': update({ toast:null }); break;
        case 'CONNECT': {
          if (state.connections.some(item => item.itemId === action.itemId)) { update({ overlay:null, toast:'该连接已发起' }); break; }
          update({ connections:[{ itemId:action.itemId, status:'待回应', createdAt:Date.now() }, ...state.connections], growthScore:state.growthScore + 20, overlay:null, toast:'连接已发起，等待对方回应' });
          break;
        }
        case 'CREATE_ITEM': {
          const title = action.payload?.title?.trim();
          const description = action.payload?.description?.trim();
          if (!title || !description) { update({ toast:'请填写标题和描述' }); break; }
          const item = { ...action.payload, id:`created-${Date.now()}`, title, description, channel:'热门', author:'我', match:null, meta:'刚刚发布', tags:[action.payload.type || '内容'], image:'' };
          update({ createdItems:[item, ...state.createdItems], activeTab:'home', activeChannel:'热门', overlay:null, toast:'发布成功，已加入热门' });
          break;
        }
        case 'SHOW_TOAST': update({ toast:action.message }); break;
      }
    }
  };
}
