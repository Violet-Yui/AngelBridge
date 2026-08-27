import { CHANNELS, FEED_ITEMS, ZODIAC_PETS, PROFILE, INITIAL_MESSAGES } from './data.js';

const escape = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const petFor = state => ZODIAC_PETS.find(p => p.id === state.selectedPet) || ZODIAC_PETS[3];
const itemFor = (state, id) => [...state.createdItems, ...FEED_ITEMS].find(item => item.id === id);

function statusBar() { return `<div class="statusbar"><b>9:41</b><div class="apple-status" aria-label="蜂窝网络、无线网络和电池状态"><span class="cellular-icon"><i></i><i></i><i></i><i></i></span><span class="wifi-icon"><i></i></span><span class="battery-icon"><i></i></span></div></div>`; }
function topBar(title = '此刻', back = false) { return `<header class="topbar">${back ? '<button class="icon-btn" data-action="back" aria-label="返回"><span class="back-icon"></span></button>' : '<button class="icon-btn" data-action="search" aria-label="搜索"><span class="search-icon"></span></button>'}<div class="mode"><span>关注</span><b>${escape(title)}</b></div><span class="top-spacer" aria-hidden="true"></span></header>`; }

function navIcon(id) {
  if (id === 'create') return '<span class="nav-symbol create-symbol"></span>';
  const icons = {
    home:'<svg class="nav-symbol home-symbol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/></svg>',
    messages:'<svg class="nav-symbol messages-symbol" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-5 3v-12A2.5 2.5 0 0 1 6.5 4.5Z"/></svg>',
    bridge:'<svg class="nav-symbol bridge-symbol" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 5.8a5.4 5.4 0 0 0-7.7 0L12 6.9l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 22l8.8-8.5a5.4 5.4 0 0 0 0-7.7Z"/></svg>',
    profile:'<svg class="nav-symbol profile-symbol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4.5"/><path d="M4.5 21v-1.8a7.5 7.5 0 0 1 15 0V21"/></svg>'
  };
  return icons[id];
}

export function renderBottomNav(activeTab) {
  const nav = [['home','天使桥'],['messages','消息'],['create','创建'],['bridge','桥约'],['profile','我']];
  return `<nav class="bottom-nav" aria-label="主导航">${nav.map(([id,label]) => `<button class="nav-btn ${id}-nav ${activeTab === id ? 'is-active' : ''} ${id === 'create' ? 'is-create' : ''}" data-tab="${id}" aria-label="${label}">${navIcon(id)}<small>${label}</small></button>`).join('')}</nav>`;
}

function channels(active) { return `<div class="channels" role="tablist">${CHANNELS.map(name => `<button role="tab" aria-selected="${name===active}" class="chip ${name===active?'active':''}" data-channel="${name}">${name}</button>`).join('')}</div>`; }
function media(item) { return item.image ? `<img src="${item.image}" alt="${escape(item.title)}" loading="lazy">` : `<div class="image-fallback">${escape(item.tags?.[0] || '新')}</div>`; }
function card(item, variant='grid') { return `<article class="feed-card ${variant}" tabindex="0" data-item-id="${item.id}">${media(item)}<div class="card-body">${item.match ? `<span class="match-badge">匹配 ${item.match}%</span>` : '<span class="match-badge neutral">我的发布</span>'}<h3>${escape(item.title)}</h3><p>${escape(item.author)} · ${escape(item.meta)}</p><div class="tag-row">${(item.tags||[]).slice(0,2).map(tag=>`<span>${escape(tag)}</span>`).join('')}</div></div></article>`; }

function renderChannelBody(state, items) {
  if (state.activeChannel === '热门') {
    const [featured, ...rest] = items;
    return `<section class="hot-layout">${featured ? `<article class="hot-feature" data-item-id="${featured.id}"><div><span>热门话题</span><h2>${escape(featured.title)}</h2><p>${escape(featured.meta)}</p></div><b>成长</b></article>` : ''}<div class="hot-list">${rest.map(item => card(item,'row')).join('')}</div></section>`;
  }
  if (state.activeChannel === '找工作') return `<section class="feed-list">${items.map(item => card(item,'job-row')).join('')}</section>`;
  if (state.activeChannel === '视频') return `<section class="feed-grid video-grid">${items.map(item => card(item,'video-card')).join('')}</section>`;
  if (state.activeChannel === '经验') return `<section class="feed-grid experience-grid">${items.map(item => card(item,'experience-card')).join('')}</section>`;
  if (state.activeChannel === '找人') return `<section class="feed-grid people-grid">${items.map(item => card(item,'person-card')).join('')}</section>`;
  if (state.activeChannel === '找物') return `<section class="feed-grid goods-grid">${items.map(item => card(item,'goods-card')).join('')}</section>`;
  if (state.activeChannel === '闲置') return `<section class="feed-grid idle-grid">${items.map(item => card(item,'idle-card')).join('')}</section>`;
  return '';
}

function renderHome(state) {
  if (state.activeChannel === '人生树') return `${topBar('此刻')}${channels(state.activeChannel)}${renderTreeBody(state)}`;
  const items = [...state.createdItems, ...FEED_ITEMS.filter(item => item.channel === state.activeChannel)];
  const filterSets = {
    找人:['推荐','附近','技能','兴趣','同城'],
    找物:['推荐','附近','求购','交换','筛选'],
    找工作:['推荐','附近','全职','实习','远程'],
    闲置:['全部','附近','免邮','交换','低价'],
    经验:['推荐','热门','最新','实用','生活'],
    视频:['推荐','热门','旅行','音乐','手作'],
    热门:['热门话题','热门问答','热门机会']
  };
  const filters = filterSets[state.activeChannel] || ['推荐','附近','最新'];
  return `${topBar('此刻')}${channels(state.activeChannel)}<div class="filter-row">${filters.map((label,index)=>`<button class="filter ${index===0?'active':''}">${label}</button>`).join('')}</div>${items.length ? renderChannelBody(state,items) : `<section class="empty"><b>这里还没有内容</b><p>先回热门看看今天的新机会。</p><button data-channel="热门">返回热门</button></section>`}`;
}

function renderDetail(state) {
  const item = itemFor(state, state.selectedItemId);
  if (!item) return renderHome(state);
  const connected = state.connections.some(connection => connection.itemId === item.id);
  return `${topBar('匹配详情', true)}<article class="detail">${media(item)}<div class="detail-content"><div class="detail-meta"><span>${escape(item.author)}</span><span>${escape(item.meta)}</span></div><h1>${escape(item.title)}</h1><div class="tag-row">${(item.tags||[]).map(tag=>`<span>${escape(tag)}</span>`).join('')}</div><p class="description">${escape(item.description)}</p>${item.match ? `<section class="match-panel"><div class="match-score"><strong>${item.match}%</strong><span>高度匹配</span></div><h2>为什么推荐给你</h2><div class="value-pair"><div><small>对方可以提供</small><b>${escape(item.give)}</b></div><span>↔</span><div><small>对方正在寻找</small><b>${escape(item.need)}</b></div></div><p>你关注的方向与这条信息形成了明确互补，建议先用一次轻量沟通确认彼此目标。</p></section>` : ''}<button class="primary-action" data-action="connect" data-item="${item.id}" ${connected?'disabled':''}>${connected?'已发起 · 待回应':'发起连接'}</button></div></article>`;
}

function renderMessages(state) {
  const connections = state.connections.map(connection => ({ ...connection, item:itemFor(state, connection.itemId) })).filter(x=>x.item);
  return `${topBar('消息')}<section class="page-pad"><div class="section-heading"><div><p>保持连接</p><h1>消息</h1></div><span>${connections.length + 1}</span></div><div class="message-list">${INITIAL_MESSAGES.map(msg=>`<article class="message pet-message"><img src="${petFor(state).image}" alt="${petFor(state).name}"><div><div><b>${msg.title}</b><time>${msg.time}</time></div><p>${msg.body}</p></div></article>`).join('')}${connections.map(({item,status})=>`<article class="message" data-item-id="${item.id}"><div class="message-thumb">${item.image?`<img src="${item.image}" alt="">`:'桥'}</div><div><div><b>${escape(item.title)}</b><time>刚刚</time></div><p>连接请求已送达，等待对方独立回应。</p><span class="status-pill">${status}</span></div></article>`).join('')}</div></section>`;
}

function renderTreeBody(state) {
  const pet = petFor(state);
  return `<section class="tree-page"><div class="tree-summary"><div><p>早上好，小桥</p><h1>主人的人生树</h1><span>生命树 · 壮年期</span></div><div class="tree-mini"><div class="mini-canopy"></div><div class="mini-trunk"></div></div><b>${state.growthScore}</b></div><div class="stats"><div><b>${PROFILE.owned}</b><span>我的拥有</span></div><div><b>${PROFILE.wishes}</b><span>我的心愿</span></div><div><b>${PROFILE.opportunities + state.connections.length}</b><span>发现机会</span></div></div><div class="section-title"><h2>小天为你匹配到的</h2><button data-channel="热门">查看全部</button></div><div class="mini-matches">${FEED_ITEMS.filter(x=>x.match>=93).slice(0,3).map(item=>`<button data-item-id="${item.id}">${media(item)}<b>${item.match}%</b><span>${escape(item.title)}</span></button>`).join('')}</div><div class="section-title"><h2>待确认事项</h2><span>${state.connections.length}</span></div>${state.connections.length ? `<div class="pending-list">${state.connections.map(c=>{const item=itemFor(state,c.itemId);return `<button data-item-id="${c.itemId}"><span><b>${escape(item?.title)}</b><small>等待对方回应</small></span><em>待确认</em></button>`}).join('')}</div>` : `<div class="pending-list"><button><span><b>领航新链路公寓</b><small>房东已同意出租</small></span><em>去签约</em></button><button><span><b>腾讯 AI 工程师 offer</b><small>已发邀约</small></span><em>查看</em></button></div>`}</section>`;
}

function renderTree(state) { return `${topBar('人生树')}${renderTreeBody(state)}`; }

function renderPetPage(state) {
  const pet = petFor(state);
  return `${topBar('小天智能体')}<section class="page-pad pet-page"><div class="pet-hero"><div><span>当前小天形象</span><h1>${pet.name}</h1><p>${pet.trait}，替你留意真正互补的人和机会。</p></div><img src="${pet.image}" alt="${pet.name}"></div><div class="section-title"><h2>选择小天的生肖样式</h2><small>12 种形象可选</small></div><div class="pet-grid">${ZODIAC_PETS.map(item=>`<button class="pet-card ${item.id===state.selectedPet?'selected':''}" data-pet="${item.id}" aria-label="选择${item.name}作为小天形象" aria-pressed="${item.id===state.selectedPet}"><img src="${item.image}" alt="${item.name}"><b>${item.name}</b><span>${item.trait}</span></button>`).join('')}</div></section>`;
}

function renderProfile(state) {
  const pet=petFor(state);
  return `${topBar('我')}<section class="page-pad profile-page"><div class="profile-card"><div class="avatar">桥</div><div><h1>${PROFILE.nickname}</h1><p>${PROFILE.city} · 正在让一次连接发生</p></div><img src="${pet.image}" alt="当前小天形象：${pet.name}"></div><button class="xiaotian-entry" data-action="pet"><span><small>小天智能体</small><b>${pet.name} · 12 种形象可选</b></span><span class="xiaotian-preview">${ZODIAC_PETS.slice(0,4).map(item=>`<img src="${item.image}" alt="">`).join('')}</span><i>›</i></button><div class="profile-stats"><div><b>${state.growthScore}</b><span>成长值</span></div><div><b>${state.connections.length}</b><span>连接</span></div><div><b>${state.createdItems.length}</b><span>发布</span></div></div><div class="menu-list"><button data-action="tree"><span>人生树</span><b>›</b></button><button data-action="my-posts"><span>我的发布</span><b>›</b></button><button data-action="coming"><span>隐私与设置</span><b>›</b></button></div></section>`;
}

function connectSheet(state) { const item=itemFor(state,state.overlay?.itemId); return `<div class="scrim" data-action="dismiss"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="connect-title"><div class="handle"></div><span class="sheet-icon">↗</span><h2 id="connect-title">发起一次轻量连接</h2><p>向“${escape(item?.title)}”发送本地演示请求。对方回应前，不代表连接已经成功。</p><div class="sheet-actions"><button data-action="dismiss">暂不</button><button class="primary" data-action="confirm-connect" data-item="${item?.id}">确认发起</button></div></section></div>`; }
function createSheet() { return `<div class="scrim" data-action="dismiss"><section class="sheet create-sheet" role="dialog" aria-modal="true" aria-labelledby="create-title"><div class="handle"></div><h2 id="create-title">告诉小天你想发布什么</h2><form id="create-form"><label>类型<select name="type"><option>需求</option><option>资源</option><option>内容</option></select></label><label>标题<input name="title" maxlength="32" placeholder="例如：寻找周末摄影搭档" required></label><label>描述<textarea name="description" maxlength="120" placeholder="补充地点、时间和你能提供什么" required></textarea></label><button class="primary-action" type="submit">发布到热门</button></form></section></div>`; }

export function renderOverlay(state) { if (state.overlay?.type==='connect') return connectSheet(state); if (state.overlay?.type==='create') return createSheet(); return ''; }
export function renderPage(state) { if (state.selectedItemId) return renderDetail(state); if (state.activeTab==='messages') return renderMessages(state); if (state.activeTab==='pet') return renderPetPage(state); if (state.activeTab==='profile') return renderProfile(state); if (state.activeTab==='tree' || state.activeTab==='bridge') return renderTree(state); return renderHome(state); }
export function renderApp(state) { return `<div class="app-shell">${statusBar()}<main class="app-content">${renderPage(state)}</main>${renderBottomNav(state.activeTab)}${renderOverlay(state)}${state.toast?`<div class="toast" role="status">${escape(state.toast)}</div>`:''}</div>`; }
