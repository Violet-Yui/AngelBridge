export const CHANNELS = ['人生树', '找人', '找物', '找工作', '闲置', '经验', '视频', '热门'];

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
  ,desk: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=720&q=80'
  ,console: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=720&q=80'
  ,forest: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=720&q=80'
  ,guitar: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=720&q=80'
};

export const FEED_ITEMS = [
  { id:'hot-team', channel:'热门', title:'#生命树成长计划', author:'天使桥', image:photos.team, match:94, meta:'128w 人参与 · 本周趋势', tags:['热门话题','成长'], give:'成长记录与同频伙伴', need:'愿意持续行动的人', description:'记录每一次真实连接，让生命树在行动中慢慢长大。' },
  { id:'hot-studio', channel:'热门', title:'趋势：年轻人的资源互换', author:'天使桥观察', image:photos.studio, match:89, meta:'8.9w 人正在讨论', tags:['趋势','资源互换'], give:'闲置空间与设备', need:'彼此真正需要的资源', description:'越来越多年轻人开始用资源互换建立轻量、可信的新连接。' },
  { id:'hot-question', channel:'热门', title:'热门问答：如何找到同频的人', author:'小天问答', image:photos.city, match:92, meta:'回答 2.7w', tags:['热门问答','找人'], give:'匹配建议', need:'清晰表达你的需要', description:'从目标、时间和边界三个维度，让小天更准确地理解你。' },
  { id:'hot-photo', channel:'热门', title:'热门机会：摄影搭子小组', author:'桥边摄影社', image:photos.camera, match:95, meta:'12 个席位', tags:['热门机会','摄影'], give:'周末拍摄活动', need:'摄影与出镜伙伴', description:'一起记录城市里真实的人与故事。' },
  { id:'video-tree', channel:'视频', title:'生命树成长 vlog：第12天', author:'小树苗', image:photos.plant, match:91, meta:'03:24 · 2.3w 播放', tags:['成长记录','生活'], give:'真实成长记录', need:'你的反馈', description:'记录生命树成长的第十二天，分享一个微小但真实的改变。' },
  { id:'video-craft', channel:'视频', title:'10分钟学会木条编织', author:'木作日常', image:photos.desk, match:88, meta:'10:05 · 1.8w 播放', tags:['教程','手作'], give:'入门方法', need:'愿意动手的你', description:'十分钟完成一次简单的木条编织练习。' },
  { id:'video-city', channel:'视频', title:'城市漫步 · 成都玉林路', author:'桥边放映室', image:photos.forest, match:86, meta:'05:41 · 6672 播放', tags:['城市','漫步'], give:'本地生活线索', need:'城市探索者', description:'跟随镜头认识街道和那些愿意分享故事的人。' },
  { id:'video-guitar', channel:'视频', title:'用吉他弹唱自己的歌', author:'南风', image:photos.guitar, match:84, meta:'04:12 · 1.4w 播放', tags:['音乐','分享'], give:'原创歌曲', need:'愿意倾听的人', description:'一次简单、真诚的客厅弹唱。' },
  { id:'exp-product', channel:'经验', title:'我如何用3个问题拆解一项真实需求', author:'产品小周', image:photos.laptop, match:93, meta:'小组同行 · 1.2w 赞', tags:['产品','方法'], give:'需求分析方法', need:'案例交流', description:'不从复杂表单开始，只用三个问题帮助对方说清目标、边界和下一步。' },
  { id:'exp-home', channel:'经验', title:'独居生活半年，我丢掉了80%的东西', author:'小满', image:photos.room, match:89, meta:'收藏 8631', tags:['生活','整理'], give:'生活整理经验', need:'你的实践反馈', description:'减少物品以后，我重新找回了空间与时间。' },
  { id:'exp-tools', channel:'经验', title:'高效学习的5个方法', author:'学习搭子', image:photos.desk, match:90, meta:'收藏 6542', tags:['学习','效率'], give:'学习方法', need:'同行实践者', description:'五个能立刻开始的小方法，帮助建立稳定节奏。' },
  { id:'exp-travel', channel:'经验', title:'一个人去旅行，治愈了焦虑', author:'小太阳', image:photos.city, match:86, meta:'1.3w 赞', tags:['旅行','成长'], give:'独行经验', need:'同路人的故事', description:'把注意力交还给沿途，也重新学会照顾自己。' },
  { id:'idle-bike', channel:'闲置', title:'九成新公路车', author:'广州 · 自提', image:photos.bike, match:88, meta:'¥680', tags:['运动','自提'], give:'公路自行车', need:'同城自取', description:'骑行不到十次，车况很好，希望交给真正会使用它的人。' },
  { id:'idle-camera', channel:'闲置', title:'复古胶片相机', author:'成都 · 可邮寄', image:photos.camera, match:90, meta:'¥950', tags:['摄影','闲置'], give:'胶片相机', need:'直接购买或交换', description:'相机功能正常，外观有轻微使用痕迹。' },
  { id:'idle-desk', channel:'闲置', title:'实木书桌', author:'同城 · 自提', image:photos.desk, match:84, meta:'免费', tags:['家具','搬家'], give:'小尺寸实木书桌', need:'周末上门自取', description:'桌面有轻微使用痕迹，结构稳固，适合小房间使用。' },
  { id:'idle-console', channel:'闲置', title:'Switch 游戏机', author:'武汉 · 自提', image:photos.console, match:87, meta:'¥1580', tags:['数码','闲置'], give:'Switch 游戏机', need:'直接购买', description:'机器使用正常，配件齐全。' },
  { id:'job-ai', channel:'找工作', title:'AI 产品体验设计师', author:'青川科技', image:photos.studio, match:96, meta:'成都 · 20–30K', tags:['UX','AI产品'], give:'成长型团队与真实项目', need:'端到端体验设计能力', description:'负责 AI 原生产品的用户研究、交互框架和验证，和产品、算法、工程一起把复杂能力变得可信易用。' },
  { id:'job-community', channel:'找工作', title:'社区运营策划', author:'附近之间', image:photos.team, match:87, meta:'远程 · 12–18K', tags:['社区','内容策划'], give:'灵活工作与共创空间', need:'社区活动经验', description:'一起设计有温度的线上线下互助活动，让真实连接持续发生。' },
  { id:'find-camera', channel:'找物', title:'寻找一台适合新手的二手微单', author:'夏栀', image:photos.camera, match:92, meta:'预算 3000 元以内', tags:['求购','摄影'], give:'合理预算', need:'相机与选购建议', description:'想开始记录城市人物，希望找到成色可靠、适合新手的微单。' },
  { id:'find-desk', channel:'找物', title:'求一张适合小空间的书桌', author:'木木', image:photos.room, match:85, meta:'同城优先', tags:['求物','家居'], give:'上门自取', need:'小尺寸书桌', description:'房间空间有限，希望宽度不超过 100cm，可自取。' },
  { id:'find-person', channel:'找人', title:'寻找周末城市人物摄影搭档', author:'小桔', image:photos.city, match:95, meta:'成都 · 周末', tags:['摄影','城市记录'], give:'策划与后期', need:'摄影或采访伙伴', description:'想记录普通人的生活故事，寻找同样喜欢观察城市的人一起完成。' },
  { id:'find-mentor', channel:'找人', title:'寻找愿意评审作品集的 UX 前辈', author:'林一', image:photos.laptop, match:93, meta:'线上 · 30 分钟', tags:['UX','作品集'], give:'用户研究案例', need:'专业反馈', description:'正在准备 UX 作品集，希望得到一次聚焦结构与叙事的真实反馈。' }
];

export const PROFILE = { nickname:'小桥', city:'成都', growthBase:1000, owned:18, wishes:8, opportunities:9 };
export const INITIAL_MESSAGES = [{ id:'pet-welcome', type:'pet', title:'小天', body:'主人，我把今天适合你的机会整理好了。先从一个真正想推进的连接开始吧。', time:'刚刚' }];
