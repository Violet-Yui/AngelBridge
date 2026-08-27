export const CHANNELS = ['热门', '视频', '经验', '闲置', '找工作', '找物', '找人'];

export const ZODIAC_PETS = [
  {id:'01-rat',name:'子鼠',trait:'机敏陪伴',image:'assets/zodiac/01-rat.svg'},
  {id:'02-ox',name:'丑牛',trait:'稳稳托举',image:'assets/zodiac/02-ox.svg'},
  {id:'03-tiger',name:'寅虎',trait:'勇敢开路',image:'assets/zodiac/03-tiger.svg'},
  {id:'04-rabbit',name:'卯兔',trait:'温柔倾听',image:'assets/zodiac/04-rabbit.svg'},
  {id:'05-dragon',name:'辰龙',trait:'连接机会',image:'assets/zodiac/05-dragon.svg'},
  {id:'06-snake',name:'巳蛇',trait:'洞察需求',image:'assets/zodiac/06-snake.svg'},
  {id:'07-horse',name:'午马',trait:'行动加速',image:'assets/zodiac/07-horse.svg'},
  {id:'08-goat',name:'未羊',trait:'暖心守护',image:'assets/zodiac/08-goat.svg'},
  {id:'09-monkey',name:'申猴',trait:'灵感搭档',image:'assets/zodiac/09-monkey.svg'},
  {id:'10-rooster',name:'酉鸡',trait:'准时提醒',image:'assets/zodiac/10-rooster.svg'},
  {id:'11-dog',name:'戌狗',trait:'可靠伙伴',image:'assets/zodiac/11-dog.svg'},
  {id:'12-pig',name:'亥猪',trait:'松弛陪伴',image:'assets/zodiac/12-pig.svg'}
];

const photos = {
  team: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=720&q=80',
  studio: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=720&q=80',
  camera: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=720&q=80',
  room: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=720&q=80',
  bike: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=720&q=80',
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=720&q=80',
  plant: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=720&q=80',
  city: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=720&q=80'
};

export const FEED_ITEMS = [
  { id:'hot-team', channel:'热门', title:'一起把社区里的好想法变成真实行动', author:'暖桥计划', image:photos.team, match:94, meta:'12 人正在参与', tags:['社区共创','产品经验'], give:'成熟的社区资源', need:'愿意共同推进的人', description:'我们正在寻找愿意参与社区共创的伙伴，用一次小行动，让互助真正发生。' },
  { id:'hot-studio', channel:'热门', title:'周末开放工作室，交换彼此的专业经验', author:'小满工作室', image:photos.studio, match:89, meta:'已连接 28 次', tags:['空间','经验交换'], give:'共享空间与设备', need:'摄影和策划支持', description:'把闲置的空间开放出来，也期待遇见不同专业的人，一起做点有意思的事。' },
  { id:'video-tree', channel:'视频', title:'生命树成长 Vlog：一次连接如何发生', author:'小天记录站', image:photos.plant, match:91, meta:'03:24 · 1.2w 播放', tags:['成长记录','真实故事'], give:'真实连接案例', need:'你的反馈', description:'从表达需要，到小天给出匹配，再到第一次见面，完整记录一段连接故事。' },
  { id:'video-city', channel:'视频', title:'城市漫步：成都玉林路的互助小店', author:'桥边放映室', image:photos.city, match:86, meta:'10:05 · 8.6k 播放', tags:['城市','互助'], give:'本地生活线索', need:'城市探索者', description:'跟随镜头认识那些愿意分享空间、技能和时间的小店。' },
  { id:'exp-product', channel:'经验', title:'我如何用 3 个问题拆清一份真实需求', author:'产品小周', image:photos.laptop, match:93, meta:'8 分钟阅读', tags:['产品','需求'], give:'需求分析方法', need:'案例交流', description:'不从复杂表单开始，只用三个问题帮助对方说清楚目标、边界和下一步。' },
  { id:'exp-space', channel:'经验', title:'从陌生到合作：共享空间的第一次活动', author:'阿禾', image:photos.room, match:84, meta:'163 人收藏', tags:['活动','空间'], give:'活动复盘', need:'场地运营经验', description:'记录第一次社区活动中真正有效的流程，以及我们踩过的坑。' },
  { id:'idle-bike', channel:'闲置', title:'九成新城市通勤自行车，寻找需要的人', author:'北桥', image:photos.bike, match:88, meta:'¥680 · 同城自提', tags:['闲置','同城'], give:'通勤自行车', need:'自取或等价交换', description:'骑行不到十次，车况很好，希望交给真正会使用它的人。' },
  { id:'idle-camera', channel:'闲置', title:'复古胶片相机，可交换一次人像拍摄', author:'一卷光', image:photos.camera, match:90, meta:'交换优先', tags:['摄影','交换'], give:'胶片相机', need:'一次人像拍摄', description:'相机功能正常，带一卷胶片。比起出售，更想交换一次认真拍摄。' },
  { id:'job-ai', channel:'找工作', title:'AI 产品体验设计师', author:'青川科技', image:photos.studio, match:96, meta:'成都 · 20–30K', tags:['UX','AI产品'], give:'成长型团队与真实项目', need:'端到端体验设计能力', description:'负责 AI 原生产品的用户研究、交互框架和验证，和产品、算法、工程一起把复杂能力变得可信易用。' },
  { id:'job-community', channel:'找工作', title:'社区运营策划', author:'附近之间', image:photos.team, match:87, meta:'远程 · 12–18K', tags:['社区','内容策划'], give:'灵活工作与共创空间', need:'社区活动经验', description:'一起设计有温度的线上线下互助活动，让真实连接持续发生。' },
  { id:'find-camera', channel:'找物', title:'寻找一台适合新手的二手微单', author:'夏栀', image:photos.camera, match:92, meta:'预算 3000 元以内', tags:['求购','摄影'], give:'合理预算', need:'相机与选购建议', description:'想开始记录城市人物，希望找到成色可靠、适合新手的微单。' },
  { id:'find-desk', channel:'找物', title:'求一张适合小空间的书桌', author:'木木', image:photos.room, match:85, meta:'同城优先', tags:['求物','家居'], give:'上门自取', need:'小尺寸书桌', description:'房间空间有限，希望宽度不超过 100cm，可自取。' },
  { id:'find-person', channel:'找人', title:'寻找周末城市人物摄影搭档', author:'小桔', image:photos.city, match:95, meta:'成都 · 周末', tags:['摄影','城市记录'], give:'策划与后期', need:'摄影或采访伙伴', description:'想记录普通人的生活故事，寻找同样喜欢观察城市的人一起完成。' },
  { id:'find-mentor', channel:'找人', title:'寻找愿意评审作品集的 UX 前辈', author:'林一', image:photos.laptop, match:93, meta:'线上 · 30 分钟', tags:['UX','作品集'], give:'用户研究案例', need:'专业反馈', description:'正在准备 UX 作品集，希望得到一次聚焦结构与叙事的真实反馈。' }
];

export const PROFILE = { nickname:'小桥', city:'成都', growthBase:1000, owned:18, wishes:8, opportunities:9 };
export const INITIAL_MESSAGES = [{ id:'pet-welcome', type:'pet', title:'小天', body:'主人，我把今天适合你的机会整理好了。先从一个真正想推进的连接开始吧。', time:'刚刚' }];
