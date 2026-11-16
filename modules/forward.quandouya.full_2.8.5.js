// 全豆要[聚合音源] -> Rex / Forward music source
// Upstream: https://77f77.48364836.xyz/lx/?1#全豆要
// Upstream version: v4.1
//
// The original LX source only resolves music URLs for tracks already supplied
// by LX. This Rex port adds search, curated Netease charts, platform search,
// and automatic playback fallback while retaining the original APIs.

var QDY_UPSTREAM_URL = "https://77f77.48364836.xyz/lx/?1";
var QDY_NETEASE_API =
  "https://music-api.gdstudio.xyz/api.php" +
  "?use_xbridge3=true&loader_name=forest&need_sec_link=1" +
  "&sec_link_scene=im&theme=light";
var QDY_NETEASE_WEB = "https://music.163.com/api";
var QDY_QQ_SEARCH = "https://c.y.qq.com/soso/fcgi-bin/client_search_cp";
var QDY_QQ_VKEY = "https://u.y.qq.com/cgi-bin/musicu.fcg";
var QDY_KUWO_SEARCH = "https://search.kuwo.cn/r.s";
var QDY_KUWO_PLAY =
  "https://musicapi.haitangw.net/music/kw.php?type=mp3";
var QDY_KUGOU_SEARCH = "https://songsearch.kugou.com/song_search_v2";
var QDY_KUGOU_PLAY = "https://m.kugou.com/app/i/getSongInfo.php";
var QDY_KUGOU_CHART = "http://mobilecdnbj.kugou.com/api/v3/rank/song";
var QDY_MIGU_SEARCH =
  "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/search_all.do";
var QDY_MIGU_PLAY =
  "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/sub/listenSong.do";
var QDY_MIGU_CHART =
  "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/querycontentbyId.do";
var QDY_KUWO_CHART = "https://wbd.kuwo.cn/api/bd/bang/bang_info";
var QDY_QISHUI_API = "https://api.vsaa.cn/api/music.qishui.vip";
var QDY_QISHUI_PROXY = "https://proxy.qishui.vsaa.cn/qishui/proxy";
var QDY_CNET_SUBTITLE = "https://paste.c-net.org/";
var QDY_UGUU_SUBTITLE = "https://uguu.se/upload?output=text";
var QDY_PASTES_SUBTITLE = "https://api.pastes.dev/post";
var QDY_LRC_HOST = "";
var QDY_LRCLIB_API = "https://lrclib.net/api/search";
var QDY_TIMEOUT = 12000;
var QDY_SUBTITLE_TIMEOUT = 2000;
var QDY_FAVORITES_KEY = "quandouyaFavoritesV1";
var QDY_FAVORITES_MAX = 500;
var QDY_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/142.0.0.0 Safari/537.36";

var QDY_ICON = "https://rex-config.108917164.workers.dev/f/icons/quandouya.png";

var WidgetMetadata = {
  id: "forward.quandouya.full",
  title: "全豆要音源",
  description:
    "聚合网易云、QQ、酷我、酷狗、咪咕与汽水接口；新增五平台实时音乐榜单，LRC 优先使用用户自定义托管并支持自动续播换歌。",
  author: "Walkman",
  site: QDY_UPSTREAM_URL,
  iconurl: QDY_ICON,
  version: "2.8.5",
  requiredVersion: "0.0.1",
  detailCacheDuration: 0,
  globalParams: [
    {
      name: "quality",
      title: "默认音质",
      type: "enumeration",
      value: "320k",
      enumOptions: [
        { title: "128K", value: "128k" },
        { title: "320K", value: "320k" },
        { title: "无损 FLAC", value: "flac" },
        { title: "24bit / Hi-Res", value: "24bit" }
      ],
      description: "优先请求所选音质；资源不支持时由线路返回可用版本。"
    },
    {
      name: "fallback_enabled",
      title: "多线路回退",
      type: "enumeration",
      value: "enabled",
      enumOptions: [
        { title: "启用", value: "enabled" },
        { title: "关闭", value: "disabled" }
      ],
      description: "当前平台受版权限制时，自动尝试酷我和网易云备用线路。"
    },
    {
      name: "lyrics_enabled",
      title: "LRC 歌词",
      type: "enumeration",
      value: "enabled",
      enumOptions: [
        { title: "启用", value: "enabled" },
        { title: "关闭", value: "disabled" }
      ],
      description: "自动读取当前歌曲时间轴歌词，以 Rex 原生 LRC 轨道显示。"
    },
    {
      name: "subtitle_service_url",
      title: "自建 LRC 托管服务",
      type: "input",
      value: "",
      description: "可选。主托管与 Uguu 均失败后，再尝试此 LRC 文本上传地址。"
    },
    {
      name: "subtitle_service_token",
      title: "LRC 托管服务密钥",
      type: "input",
      value: "",
      description: "可选自建 LRC 服务的上传密钥。只保存在本机模块配置中。"
    },
    {
      name: "lrc_host_url",
      title: "LRC 主托管接口（可选）",
      type: "input",
      value: QDY_LRC_HOST,
      description: "默认留空，不调用 Cloudflare 歌词上传接口；填写兼容 HTTP(S) 地址后才优先使用。"
    },
    {
      name: "player_engine",
      title: "播放器内核",
      type: "enumeration",
      value: "app",
      enumOptions: [
        { title: "应用播放器（LRC 推荐）", value: "app" },
        { title: "系统播放器（兼容模式）", value: "system" }
      ],
      description: "应用播放器优先保证 LRC 歌词显示；遇到兼容问题可切换系统播放器。"
    },
    {
      name: "result_limit",
      title: "每页数量",
      type: "input",
      value: "30",
      description: "分类和搜索每页返回 6-50 首，默认 30 首。"
    },
    {
      name: "category_queue_limit",
      title: "分类播放队列",
      type: "input",
      value: "0",
      description: "默认 0 表示加载分类全部歌曲；也可填写 20-1000 限制数量。"
    }
  ],
  modules: [
    {
      id: "favoriteList",
      title: "我的收藏",
      functionName: "favoriteList",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "favoriteManager",
      title: "收藏管理",
      functionName: "favoriteManager",
      type: "video",
      cacheDuration: 0,
      params: [
        {
          name: "operation",
          title: "操作",
          type: "enumeration",
          value: "add",
          enumOptions: [
            { title: "添加收藏", value: "add" },
            { title: "移除收藏", value: "remove" },
            { title: "移到最前", value: "top" }
          ],
          description: "选择添加、移除或调整收藏顺序。"
        },
        {
          name: "keyword",
          title: "歌名、歌手或歌曲链接",
          type: "input",
          value: "",
          placeholders: [
            { title: "晴天 周杰伦", value: "晴天 周杰伦" },
            { title: "海屿你", value: "海屿你" }
          ],
          description: "输入歌名和歌手更容易精确匹配；也可粘贴全豆要歌曲链接。"
        },
        {
          name: "source",
          title: "添加时搜索平台",
          type: "enumeration",
          value: "all",
          enumOptions: [
            { title: "全部平台", value: "all" },
            { title: "网易云音乐", value: "netease" },
            { title: "QQ 音乐", value: "qq" },
            { title: "酷我音乐", value: "kuwo" },
            { title: "酷狗音乐", value: "kugou" },
            { title: "咪咕音乐", value: "migu" },
            { title: "汽水音乐", value: "qishui" }
          ],
          description: "仅添加收藏时使用；移除和置顶会直接匹配本地收藏。"
        },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      id: "latestAllV2",
      title: "网易云热歌榜",
      functionName: "latestAllV2",
      type: "video",
      cacheDuration: 0,
      params: []
    },
    {
      id: "categoryMandarinV2",
      title: "华语私人雷达",
      functionName: "categoryMandarinV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryWesternV2",
      title: "欧美私人雷达",
      functionName: "categoryWesternV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryCantoneseV2",
      title: "粤语经典",
      functionName: "categoryCantoneseV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryInstrumentalV2",
      title: "纯音乐",
      functionName: "categoryInstrumentalV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryElectronicV2",
      title: "电子舞曲",
      functionName: "categoryElectronicV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryRockV2",
      title: "摇滚",
      functionName: "categoryRockV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryFolkV2",
      title: "民谣",
      functionName: "categoryFolkV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "chartKuwo",
      title: "酷我榜单",
      functionName: "chartKuwo",
      type: "video",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "chartKugou",
      title: "酷狗榜单",
      functionName: "chartKugou",
      type: "video",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "chartQQ",
      title: "QQ 音乐榜单",
      functionName: "chartQQ",
      type: "video",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "chartNetease",
      title: "网易云榜单",
      functionName: "chartNetease",
      type: "video",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "chartMigu",
      title: "咪咕榜单",
      functionName: "chartMigu",
      type: "video",
      cacheDuration: 600,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "loadResource",
      title: "全豆要播放与下载",
      description: "解析当前歌曲的多平台音频地址，支持播放器直接下载",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: []
    }
  ],
  search: {
    title: "搜索全豆要音源",
    functionName: "searchQdy",
    type: "video",
    params: [
      {
        name: "keyword",
        title: "歌曲、歌手或专辑",
        type: "input",
        value: "",
        placeholders: [
          { title: "周杰伦", value: "周杰伦" },
          { title: "晴天", value: "晴天" },
          { title: "华语经典", value: "华语经典" }
        ]
      },
      {
        name: "source",
        title: "搜索平台",
        type: "enumeration",
        value: "all",
        enumOptions: [
          { title: "全部平台", value: "all" },
          { title: "网易云音乐", value: "netease" },
          { title: "QQ 音乐", value: "qq" },
          { title: "酷我音乐", value: "kuwo" },
          { title: "酷狗音乐", value: "kugou" },
          { title: "咪咕音乐", value: "migu" },
          { title: "汽水音乐", value: "qishui" }
        ]
      },
      { name: "page", title: "页码", type: "page" }
    ]
  }
};

var qdySourceMeta = {
  netease: { name: "网易云音乐", short: "网易云" },
  qq: { name: "QQ 音乐", short: "QQ" },
  kuwo: { name: "酷我音乐", short: "酷我" },
  kugou: { name: "酷狗音乐", short: "酷狗" },
  migu: { name: "咪咕音乐", short: "咪咕" },
  qishui: { name: "汽水音乐", short: "汽水" }
};

var qdyPlaylists = {
  latestAll: {
    id: "3778678",
    title: "网易云热歌榜",
    keyword: "热歌",
    count: 200,
    cover: "https://p1.music.126.net/0SUEG8yDACfx0Bw2MYFv4Q==/109951170048519512.jpg"
  },
  categoryMandarin: {
    id: "2829883282",
    title: "华语私人雷达",
    keyword: "华语流行",
    count: 35,
    cover: "https://p1.music.126.net/NaSOolKiCwxsljTiMWImTg==/109951169058725193.jpg"
  },
  categoryWestern: {
    id: "2829816518",
    title: "欧美私人雷达",
    keyword: "欧美流行",
    count: 35,
    cover: "https://p1.music.126.net/kBUPrLfB9-OZXHrf8aVbSw==/109951168609048221.jpg"
  },
  categoryCantonese: {
    id: "2237551001",
    title: "粤语经典",
    keyword: "粤语经典",
    count: 211,
    cover: "https://p1.music.126.net/PsONIoIzCJ-9gPCAeq9ahw==/19115009649498152.jpg"
  },
  categoryInstrumental: {
    id: "316192152",
    title: "纯音乐",
    keyword: "纯音乐",
    count: 561,
    cover: "https://p1.music.126.net/jB3KG-a0Nq39sT2Xp4IZpQ==/109951163138588916.jpg"
  },
  categoryElectronic: {
    id: "2802306619",
    title: "电子舞曲",
    keyword: "欧美电子",
    count: 420,
    cover: "https://p1.music.126.net/AzIJtO5u93rm4-DLmMiBjQ==/109951164116093402.jpg"
  },
  categoryRock: {
    id: "3088403692",
    title: "中国摇滚",
    keyword: "中国摇滚",
    count: 168,
    cover: "https://p1.music.126.net/7TPPvYN62ki-6U8CE7B8bQ==/109951164513274541.jpg"
  },
  categoryFolk: {
    id: "2770902965",
    title: "民谣",
    keyword: "民谣",
    count: 295,
    cover: "https://p1.music.126.net/wldFtES1Cjnbqr5bjlqQbg==/18876415625841069.jpg"
  }
};

var qdyChartCatalog = JSON.parse(
  '{"kw":{"name":"酷我音乐","boards":[{"id":"93","name":"飙升榜"},{"id":"17","name":"新歌榜"},{"id":"16","name":"热歌榜"},{"id":"158","name":"抖音热歌榜"},{"id":"292","name":"铃声榜"},{"id":"284","name":"热评榜"},{"id":"290","name":"ACG新歌榜"},{"id":"286","name":"台湾KKBOX榜"},{"id":"279","name":"冬日暖心榜"},{"id":"281","name":"巴士随身听榜"},{"id":"255","name":"KTV点唱榜"},{"id":"280","name":"家务进行曲榜"},{"id":"282","name":"熬夜修仙榜"},{"id":"283","name":"枕边轻音乐榜"},{"id":"278","name":"古风音乐榜"},{"id":"264","name":"Vlog音乐榜"},{"id":"242","name":"电音榜"},{"id":"187","name":"流行趋势榜"},{"id":"204","name":"现场音乐榜"},{"id":"186","name":"ACG神曲榜"},{"id":"185","name":"最强翻唱榜"},{"id":"26","name":"经典怀旧榜"},{"id":"104","name":"华语榜"},{"id":"182","name":"粤语榜"},{"id":"22","name":"欧美榜"},{"id":"184","name":"韩语榜"},{"id":"183","name":"日语榜"},{"id":"145","name":"会员畅听榜"},{"id":"153","name":"网红新歌榜"},{"id":"64","name":"影视金曲榜"},{"id":"176","name":"DJ嗨歌榜"},{"id":"106","name":"真声音"},{"id":"12","name":"Billboard榜"},{"id":"49","name":"iTunes音乐榜"},{"id":"180","name":"beatport电音榜"},{"id":"13","name":"英国UK榜"},{"id":"164","name":"百大DJ榜"},{"id":"246","name":"YouTube音乐排行榜"},{"id":"265","name":"韩国Genie榜"},{"id":"14","name":"韩国M-net榜"},{"id":"8","name":"香港电台榜"},{"id":"15","name":"日本公信榜"},{"id":"151","name":"腾讯音乐人原创榜"}]},"kg":{"name":"酷狗音乐","boards":[{"id":"8888","name":"TOP500"},{"id":"6666","name":"飙升榜"},{"id":"59703","name":"蜂鸟流行音乐榜"},{"id":"52144","name":"抖音热歌榜"},{"id":"52767","name":"快手热歌榜"},{"id":"24971","name":"DJ热歌榜"},{"id":"23784","name":"网络红歌榜"},{"id":"44412","name":"说唱先锋榜"},{"id":"31308","name":"内地榜"},{"id":"33160","name":"电音榜"},{"id":"31313","name":"香港地区榜"},{"id":"51341","name":"民谣榜"},{"id":"54848","name":"台湾地区榜"},{"id":"31310","name":"欧美榜"},{"id":"33162","name":"ACG新歌榜"},{"id":"31311","name":"韩国榜"},{"id":"31312","name":"日本榜"},{"id":"49225","name":"80后热歌榜"},{"id":"49223","name":"90后热歌榜"},{"id":"49224","name":"00后热歌榜"},{"id":"33165","name":"粤语金曲榜"},{"id":"33166","name":"欧美金曲榜"},{"id":"33163","name":"影视金曲榜"},{"id":"51340","name":"伤感榜"},{"id":"35811","name":"会员专享榜"},{"id":"37361","name":"雷达榜"},{"id":"21101","name":"分享榜"},{"id":"46910","name":"综艺新歌榜"},{"id":"30972","name":"酷狗音乐人原创榜"},{"id":"60170","name":"闽南语榜"},{"id":"65234","name":"儿歌榜"},{"id":"4681","name":"美国BillBoard榜"},{"id":"25028","name":"Beatport电子舞曲榜"},{"id":"4680","name":"英国单曲榜"},{"id":"38623","name":"韩国Melon音乐榜"},{"id":"42807","name":"joox本地热歌榜"},{"id":"36107","name":"小语种热歌榜"},{"id":"4673","name":"日本公信榜"},{"id":"46868","name":"日本SPACE SHOWER榜"},{"id":"42808","name":"KKBOX风云榜"},{"id":"60171","name":"越南语榜"},{"id":"60172","name":"泰语榜"},{"id":"59895","name":"R&B榜"},{"id":"59896","name":"摇滚榜"},{"id":"59897","name":"爵士榜"},{"id":"59898","name":"乡村音乐榜"},{"id":"59900","name":"纯音乐榜"},{"id":"59899","name":"古典榜"},{"id":"22603","name":"5sing音乐榜"},{"id":"21335","name":"繁星音乐榜"},{"id":"33161","name":"古风新歌榜"},{"id":"33164","name":"纯音乐榜"}]},"tx":{"name":"QQ音乐","boards":[{"id":"4","name":"流行指数榜"},{"id":"26","name":"热歌榜"},{"id":"27","name":"新歌榜"},{"id":"62","name":"飙升榜"},{"id":"58","name":"说唱榜"},{"id":"57","name":"喜力电音榜"},{"id":"28","name":"网络歌曲榜"},{"id":"5","name":"内地榜"},{"id":"3","name":"欧美榜"},{"id":"59","name":"香港地区榜"},{"id":"16","name":"韩国榜"},{"id":"60","name":"抖快榜"},{"id":"29","name":"影视金曲榜"},{"id":"17","name":"日本榜"},{"id":"52","name":"腾讯音乐人原创榜"},{"id":"36","name":"K歌金曲榜"},{"id":"61","name":"台湾地区榜"},{"id":"63","name":"DJ舞曲榜"},{"id":"64","name":"综艺新歌榜"},{"id":"65","name":"国风热歌榜"},{"id":"67","name":"听歌识曲榜"},{"id":"72","name":"动漫音乐榜"},{"id":"73","name":"游戏音乐榜"},{"id":"75","name":"有声榜"},{"id":"131","name":"校园音乐人排行榜"},{"id":"128","name":"YouTube榜"}]},"wy":{"name":"网易云音乐","boards":[{"id":"19723756","name":"飙升榜"},{"id":"3779629","name":"新歌榜"},{"id":"2884035","name":"原创榜"},{"id":"3778678","name":"热歌榜"},{"id":"991319590","name":"说唱榜"},{"id":"71384707","name":"古典榜"},{"id":"1978921795","name":"电音榜"},{"id":"5453912201","name":"黑胶VIP爱听榜"},{"id":"71385702","name":"ACG榜"},{"id":"745956260","name":"韩语榜"},{"id":"10520166","name":"国电榜"},{"id":"180106","name":"UK排行榜周榜"},{"id":"60198","name":"美国Billboard榜"},{"id":"3812895","name":"Beatport全球电子舞曲榜"},{"id":"21845217","name":"KTV唛榜"},{"id":"60131","name":"日本Oricon榜"},{"id":"2809513713","name":"欧美热歌榜"},{"id":"2809577409","name":"欧美新歌榜"},{"id":"27135204","name":"法国 NRJ Vos Hits 周榜"},{"id":"3001835560","name":"ACG动画榜"},{"id":"3001795926","name":"ACG游戏榜"},{"id":"3001890046","name":"ACG VOCALOID榜"},{"id":"3112516681","name":"中国新乡村音乐排行榜"},{"id":"5059644681","name":"日语榜"},{"id":"5059633707","name":"摇滚榜"},{"id":"5059642708","name":"国风榜"},{"id":"5338990334","name":"潜力爆款榜"},{"id":"5059661515","name":"民谣榜"},{"id":"6688069460","name":"听歌识曲榜"},{"id":"6723173524","name":"网络热歌榜"},{"id":"6732051320","name":"俄语榜"},{"id":"6732014811","name":"越南语榜"},{"id":"6886768100","name":"中文DJ榜"},{"id":"6939992364","name":"俄罗斯top hit流行音乐榜"},{"id":"7095271308","name":"泰语榜"},{"id":"7356827205","name":"BEAT排行榜"},{"id":"7325478166","name":"编辑推荐榜VOL.44 天才女子摇滚乐队boygenius剖白卑微心迹"},{"id":"7603212484","name":"LOOK直播歌曲榜"},{"id":"7775163417","name":"赏音榜"},{"id":"7785123708","name":"黑胶VIP新歌榜"},{"id":"7785066739","name":"黑胶VIP热歌榜"},{"id":"7785091694","name":"黑胶VIP爱搜榜"},{"id":"2250011882","name":"抖音榜"},{"id":"2006508653","name":"电竞榜"}]},"mg":{"name":"咪咕音乐","boards":[{"id":"27553319","name":"新歌榜"},{"id":"27186466","name":"热歌榜"},{"id":"27553408","name":"原创榜"},{"id":"75959118","name":"音乐风向榜"},{"id":"76557036","name":"彩铃分贝榜"},{"id":"76557745","name":"会员臻爱榜"},{"id":"23189800","name":"港台榜"},{"id":"23189399","name":"内地榜"},{"id":"19190036","name":"欧美榜"},{"id":"83176390","name":"国风金曲榜"},{"id":"23603721","name":"影视榜"},{"id":"23603926","name":"华语内地榜"},{"id":"23603954","name":"华语港台榜"},{"id":"23603974","name":"欧美榜"},{"id":"23603982","name":"日韩榜"},{"id":"23604058","name":"网络榜"},{"id":"23604023","name":"彩铃榜"},{"id":"23604040","name":"KTV榜"},{"id":"23604032","name":"原创榜"}]}}'
);

var qdyRuntime = {
  quality: "320k",
  fallback: true,
  lyrics: true,
  subtitleService: "",
  subtitleToken: "",
  lrcHost: QDY_LRC_HOST,
  playerType: "app",
  limit: 30,
  queueLimit: 0
};

var qdyLyricCache = {};
var qdyCollectionCache = {};
var qdyChartCache = {};
var qdySubtitleHostCache = {};
var qdySubtitleProviderBlockedUntil = {};
var qdySubtitleProviderBlocksLoaded = false;
var qdyFavoriteMemory = [];

function qdyText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function qdyFirstText() {
  for (var index = 0; index < arguments.length; index += 1) {
    var value = qdyText(arguments[index]);
    if (value) return value;
  }
  return "";
}

function qdyClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function qdyPage(value) {
  var page = parseInt(qdyText(value || "1"), 10);
  if (!isFinite(page) || page < 1) page = 1;
  return Math.min(page, 5000);
}

function qdyQuality(value) {
  var quality = qdyText(value || "320k").toLowerCase();
  if (quality === "128" || quality === "128kbps") quality = "128k";
  if (quality === "320" || quality === "320kbps") quality = "320k";
  if (quality === "flac" || quality === "lossless" || quality === "sq") quality = "flac";
  if (quality === "24bit" || quality === "hires" || quality === "hi-res") quality = "24bit";
  if (["128k", "320k", "flac", "24bit"].indexOf(quality) < 0) quality = "320k";
  return quality;
}

function qdyLimit(params) {
  var value = parseInt(
    qdyText(
      params && (params.result_limit || params.limit || params.pageSize)
    ) || String(qdyRuntime.limit || 30),
    10
  );
  if (!isFinite(value)) value = 30;
  return qdyClamp(value, 6, 50);
}

function qdyQueueLimit(params) {
  var raw = qdyText(
    qdyFirstText(
      params && (params.category_queue_limit || params.queue_limit),
      qdyRuntime.queueLimit
    )
  ).toLowerCase();
  if (!raw || raw === "0" || raw === "all" || raw === "全部") return 0;
  var value = parseInt(raw, 10);
  if (!isFinite(value) || value <= 0) return 0;
  return qdyClamp(value, 20, 1000);
}

function qdyApplySettings(params) {
  params = params || {};
  if (params.quality) qdyRuntime.quality = qdyQuality(params.quality);
  if (params.result_limit) {
    qdyRuntime.limit = qdyLimit(params);
  }
  if (params.category_queue_limit !== undefined) {
    var queueRaw = qdyText(params.category_queue_limit).toLowerCase();
    var queueLimit = parseInt(queueRaw, 10);
    qdyRuntime.queueLimit =
      queueRaw === "all" ||
      queueRaw === "全部" ||
      (isFinite(queueLimit) && queueLimit <= 0)
        ? 0
        : isFinite(queueLimit)
          ? qdyClamp(queueLimit, 20, 1000)
          : qdyRuntime.queueLimit;
  }
  if (params.fallback_enabled !== undefined) {
    qdyRuntime.fallback =
      String(params.fallback_enabled).toLowerCase() !== "disabled" &&
      params.fallback_enabled !== false;
  }
  if (params.lyrics_enabled !== undefined) {
    qdyRuntime.lyrics =
      String(params.lyrics_enabled).toLowerCase() !== "disabled" &&
      params.lyrics_enabled !== false;
  }
  if (params.subtitle_service_url !== undefined) {
    var subtitleService = qdyText(params.subtitle_service_url).replace(
      /\/+$/,
      ""
    );
    if (subtitleService !== qdyRuntime.subtitleService) {
      qdyRuntime.subtitleService = subtitleService;
      qdySubtitleHostCache = {};
    }
  }
  if (params.subtitle_service_token !== undefined) {
    var subtitleToken = qdyText(params.subtitle_service_token);
    if (subtitleToken !== qdyRuntime.subtitleToken) {
      qdyRuntime.subtitleToken = subtitleToken;
      qdySubtitleHostCache = {};
    }
  }
  if (params.lrc_host_url !== undefined) {
    var lrcHost = qdyText(params.lrc_host_url).replace(/\/+$/, "");
    if (lrcHost !== qdyRuntime.lrcHost) {
      qdyRuntime.lrcHost = lrcHost;
      qdySubtitleHostCache = {};
    }
  }
  if (params.player_engine !== undefined) {
    qdyRuntime.playerType =
      String(params.player_engine).toLowerCase() === "app"
        ? "app"
        : "system";
  }
  return params;
}

function qdySource(value, fallback) {
  var source = qdyText(value || fallback || "").toLowerCase();
  if (source === "neteasecloudmusic" || source === "163" || source === "wy") {
    return "netease";
  }
  if (source === "tencent" || source === "qqmusic" || source === "tx") {
    return "qq";
  }
  if (source === "kugoumusic" || source === "kg") return "kugou";
  if (source === "kuwomusic" || source === "kw") return "kuwo";
  if (source === "migu music" || source === "mg") return "migu";
  if (source === "qishui music" || source === "qsvip") return "qishui";
  if (source === "all" || qdySourceMeta[source]) return source;
  return "";
}

function qdySourceName(source) {
  return qdySourceMeta[source] ? qdySourceMeta[source].name : "全豆要音源";
}

function qdyDecodeEntities(value) {
  return qdyText(value)
    .replace(/&#x([0-9a-f]+);/gi, function (_, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/&#(\d+);/g, function (_, number) {
      return String.fromCharCode(parseInt(number, 10));
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&ensp;/gi, " ")
    .replace(/&emsp;/gi, " ")
    .replace(/&middot;/gi, "·")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function qdyStripTags(value) {
  return qdyDecodeEntities(
    qdyText(value)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function qdyQuery(params) {
  return Object.keys(params || {})
    .filter(function (key) {
      return params[key] !== undefined && params[key] !== null && params[key] !== "";
    })
    .map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key]));
    })
    .join("&");
}

function qdyAbsolute(value) {
  var url = qdyText(value);
  if (!url) return "";
  if (url.indexOf("//") === 0) return "https:" + url;
  if (/^https?:\/\//i.test(url)) return url;
  return "";
}

function qdyHttps(value) {
  var url = qdyAbsolute(value);
  if (/^http:\/\//i.test(url)) return "https://" + url.slice(7);
  return url;
}

function qdyImage(value, size) {
  var url = qdyHttps(value);
  if (!url) return QDY_ICON;
  if (/music\.126\.net/i.test(url) && !/[?&]param=/i.test(url)) {
    url += (url.indexOf("?") >= 0 ? "&" : "?") + "param=" + (size || 500) + "y" + (size || 500);
  }
  return url;
}

function qdyParseJSON(value) {
  if (value && typeof value === "object") return value;
  var raw = qdyText(value).replace(/^\uFEFF/, "");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("接口返回了非 JSON 内容");
  }
}

function qdyLooseJSON(value) {
  var raw = qdyText(value).replace(/^\uFEFF/, "");
  try {
    return JSON.parse(raw);
  } catch (error) {
    var output = "";
    var inSingle = false;
    var escaped = false;
    for (var index = 0; index < raw.length; index += 1) {
      var character = raw.charAt(index);
      if (!inSingle) {
        if (character === "'") {
          output += '"';
          inSingle = true;
          escaped = false;
        } else {
          output += character;
        }
        continue;
      }
      if (escaped) {
        if (character === "'") output += "'";
        else if (character === '"') output += '\\"';
        else output += "\\" + character;
        escaped = false;
        continue;
      }
      if (character === "\\") {
        escaped = true;
      } else if (character === "'") {
        output += '"';
        inSingle = false;
      } else if (character === '"') {
        output += '\\"';
      } else {
        output += character;
      }
    }
    return JSON.parse(output);
  }
}

function qdyResponseStatus(response) {
  return Number(
    (response && (response.statusCode || response.status || response.code)) || 200
  );
}

function qdyResponseData(response) {
  if (response && response.data !== undefined) return response.data;
  return response;
}

async function qdyRequest(method, url, data, headers) {
  var options = {
    headers: Object.assign(
      {
        "User-Agent": QDY_USER_AGENT,
        Accept: "application/json,text/plain,*/*"
      },
      headers || {}
    ),
    timeout: QDY_TIMEOUT
  };
  var response =
    String(method).toUpperCase() === "POST"
      ? await Widget.http.post(url, data || {}, options)
      : await Widget.http.get(url, options);
  var status = qdyResponseStatus(response);
  if (status && (status < 200 || status >= 300)) {
    throw new Error("HTTP " + status + ": " + url);
  }
  return qdyResponseData(response);
}

async function qdyGetJSON(url, headers) {
  return qdyParseJSON(await qdyRequest("GET", url, null, headers));
}

async function qdyPostJSON(url, data, headers) {
  return qdyParseJSON(await qdyRequest("POST", url, data || {}, headers));
}

function qdySafeError(error) {
  return error && error.message ? error.message : String(error || "未知错误");
}

function qdyUTF8Bytes(value) {
  var text = qdyText(value);
  var bytes = [];
  for (var index = 0; index < text.length; index += 1) {
    var code = text.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length) {
      var low = text.charCodeAt(index + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
        index += 1;
      } else {
        code = 0xfffd;
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      code = 0xfffd;
    }
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return bytes;
}

function qdyUTF8String(bytes) {
  var encoded = "";
  for (var index = 0; index < bytes.length; index += 1) {
    encoded += "%" + ("0" + Number(bytes[index]).toString(16)).slice(-2);
  }
  try {
    return decodeURIComponent(encoded);
  } catch (error) {
    throw new Error("UTF-8 解码失败");
  }
}

function qdyBase64FromBytes(bytes) {
  var alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  for (var index = 0; index < bytes.length; index += 3) {
    var first = bytes[index];
    var second = index + 1 < bytes.length ? bytes[index + 1] : 0;
    var third = index + 2 < bytes.length ? bytes[index + 2] : 0;
    output += alphabet.charAt(first >> 2);
    output += alphabet.charAt(((first & 3) << 4) | (second >> 4));
    output +=
      index + 1 < bytes.length
        ? alphabet.charAt(((second & 15) << 2) | (third >> 6))
        : "=";
    output +=
      index + 2 < bytes.length ? alphabet.charAt(third & 63) : "=";
  }
  return output;
}

function qdyBytesFromBase64(value) {
  var alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var input = qdyText(value).replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) input += "=";
  var bytes = [];
  for (var index = 0; index < input.length; index += 4) {
    var first = alphabet.indexOf(input.charAt(index));
    var second = alphabet.indexOf(input.charAt(index + 1));
    var third = input.charAt(index + 2) === "="
      ? 0
      : alphabet.indexOf(input.charAt(index + 2));
    var fourth = input.charAt(index + 3) === "="
      ? 0
      : alphabet.indexOf(input.charAt(index + 3));
    if (first < 0 || second < 0) throw new Error("Base64 内容无效");
    bytes.push((first << 2) | (second >> 4));
    if (input.charAt(index + 2) !== "=") {
      bytes.push(((second & 15) << 4) | (third >> 2));
    }
    if (input.charAt(index + 3) !== "=") {
      bytes.push(((third & 3) << 6) | fourth);
    }
  }
  return bytes;
}

function qdyMD5(value) {
  var shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];
  var constants = [];
  for (var constantIndex = 0; constantIndex < 64; constantIndex += 1) {
    constants[constantIndex] = Math.floor(
      Math.abs(Math.sin(constantIndex + 1)) * 4294967296
    ) >>> 0;
  }
  var bytes = qdyUTF8Bytes(value);
  var originalBitLength = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  var lowLength = originalBitLength >>> 0;
  var highLength = Math.floor(originalBitLength / 4294967296) >>> 0;
  for (var lowIndex = 0; lowIndex < 4; lowIndex += 1) {
    bytes.push((lowLength >>> (lowIndex * 8)) & 0xff);
  }
  for (var highIndex = 0; highIndex < 4; highIndex += 1) {
    bytes.push((highLength >>> (highIndex * 8)) & 0xff);
  }
  var a0 = 0x67452301;
  var b0 = 0xefcdab89;
  var c0 = 0x98badcfe;
  var d0 = 0x10325476;
  function rotateLeft(number, count) {
    return ((number << count) | (number >>> (32 - count))) >>> 0;
  }
  for (var offset = 0; offset < bytes.length; offset += 64) {
    var words = [];
    for (var wordIndex = 0; wordIndex < 16; wordIndex += 1) {
      var base = offset + wordIndex * 4;
      words[wordIndex] = (
        bytes[base] |
        (bytes[base + 1] << 8) |
        (bytes[base + 2] << 16) |
        (bytes[base + 3] << 24)
      ) >>> 0;
    }
    var a = a0;
    var b = b0;
    var c = c0;
    var d = d0;
    for (var round = 0; round < 64; round += 1) {
      var f;
      var g;
      if (round < 16) {
        f = (b & c) | (~b & d);
        g = round;
      } else if (round < 32) {
        f = (d & b) | (~d & c);
        g = (5 * round + 1) % 16;
      } else if (round < 48) {
        f = b ^ c ^ d;
        g = (3 * round + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * round) % 16;
      }
      var sum = (a + f + constants[round] + words[g]) >>> 0;
      var nextD = d;
      d = c;
      c = b;
      b = (b + rotateLeft(sum, shifts[round])) >>> 0;
      a = nextD;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }
  function littleEndianHex(number) {
    var output = "";
    for (var index = 0; index < 4; index += 1) {
      output += ("0" + ((number >>> (index * 8)) & 0xff).toString(16)).slice(-2);
    }
    return output;
  }
  return littleEndianHex(a0) + littleEndianHex(b0) +
    littleEndianHex(c0) + littleEndianHex(d0);
}

var qdyAESSBox = (function() {
  var hex =
    "637c777bf26b6fc53001672bfed7ab76ca82c97dfa5947f0add4a2af9ca472c0" +
    "b7fd9326363ff7cc34a5e5f171d8311504c723c31896059a071280e2eb27b275" +
    "09832c1a1b6e5aa0523bd6b329e32f8453d100ed20fcb15b6acbbe394a4c58cf" +
    "d0efaafb434d338545f9027f503c9fa851a3408f929d38f5bcb6da2110fff3d2" +
    "cd0c13ec5f974417c4a77e3d645d197360814fdc222a908846eeb814de5e0bdb" +
    "e0323a0a4906245cc2d3ac629195e479e7c8376d8dd54ea96c56f4ea657aae08" +
    "ba78252e1ca6b4c6e8dd741f4bbd8b8a703eb5664803f60e613557b986c11d9e" +
    "e1f8981169d98e949b1e87e9ce5528df8ca1890dbfe6426841992d0fb054bb16";
  return qdyBytesFromBase64(
    qdyBase64FromBytes(
      hex.match(/.{2}/g).map(function(value) {
        return parseInt(value, 16);
      })
    )
  );
})();

var qdyAESInvSBox = (function() {
  var inverse = [];
  for (var index = 0; index < 256; index += 1) {
    inverse[qdyAESSBox[index]] = index;
  }
  return inverse;
})();

function qdyAESKeyExpansion(key) {
  var expanded = key.slice(0);
  var rcon = [1, 2, 4, 8, 16, 32, 64, 128, 27, 54];
  var generated = 16;
  var round = 1;
  while (generated < 176) {
    var temp = expanded.slice(generated - 4, generated);
    if (generated % 16 === 0) {
      temp = [
        qdyAESSBox[temp[1]] ^ rcon[round - 1],
        qdyAESSBox[temp[2]],
        qdyAESSBox[temp[3]],
        qdyAESSBox[temp[0]]
      ];
      round += 1;
    }
    for (var index = 0; index < 4; index += 1) {
      expanded[generated] = expanded[generated - 16] ^ temp[index];
      generated += 1;
    }
  }
  return expanded;
}

function qdyAESAddRoundKey(state, expanded, round) {
  for (var index = 0; index < 16; index += 1) {
    state[index] ^= expanded[round * 16 + index];
  }
}

function qdyAESSubBytes(state, inverse) {
  for (var index = 0; index < 16; index += 1) {
    state[index] = inverse
      ? qdyAESInvSBox[state[index]]
      : qdyAESSBox[state[index]];
  }
}

function qdyAESShiftRows(state, inverse) {
  var output = state.slice(0);
  for (var row = 1; row < 4; row += 1) {
    for (var column = 0; column < 4; column += 1) {
      var source = inverse
        ? (column - row + 4) % 4
        : (column + row) % 4;
      output[row + column * 4] = state[row + source * 4];
    }
  }
  state.splice.apply(state, [0, state.length].concat(output));
}

function qdyAESMultiply(left, right) {
  var result = 0;
  while (right) {
    if (right & 1) result ^= left;
    left = left & 0x80 ? ((left << 1) ^ 0x11b) : (left << 1);
    right >>= 1;
  }
  return result & 0xff;
}

function qdyAESMixColumns(state, inverse) {
  for (var column = 0; column < 4; column += 1) {
    var offset = column * 4;
    var a0 = state[offset];
    var a1 = state[offset + 1];
    var a2 = state[offset + 2];
    var a3 = state[offset + 3];
    if (inverse) {
      state[offset] =
        qdyAESMultiply(a0, 14) ^ qdyAESMultiply(a1, 11) ^
        qdyAESMultiply(a2, 13) ^ qdyAESMultiply(a3, 9);
      state[offset + 1] =
        qdyAESMultiply(a0, 9) ^ qdyAESMultiply(a1, 14) ^
        qdyAESMultiply(a2, 11) ^ qdyAESMultiply(a3, 13);
      state[offset + 2] =
        qdyAESMultiply(a0, 13) ^ qdyAESMultiply(a1, 9) ^
        qdyAESMultiply(a2, 14) ^ qdyAESMultiply(a3, 11);
      state[offset + 3] =
        qdyAESMultiply(a0, 11) ^ qdyAESMultiply(a1, 13) ^
        qdyAESMultiply(a2, 9) ^ qdyAESMultiply(a3, 14);
    } else {
      state[offset] =
        qdyAESMultiply(a0, 2) ^ qdyAESMultiply(a1, 3) ^ a2 ^ a3;
      state[offset + 1] =
        a0 ^ qdyAESMultiply(a1, 2) ^ qdyAESMultiply(a2, 3) ^ a3;
      state[offset + 2] =
        a0 ^ a1 ^ qdyAESMultiply(a2, 2) ^ qdyAESMultiply(a3, 3);
      state[offset + 3] =
        qdyAESMultiply(a0, 3) ^ a1 ^ a2 ^ qdyAESMultiply(a3, 2);
    }
  }
}

function qdyAESBlock(block, key, decrypt) {
  var expanded = qdyAESKeyExpansion(key);
  var state = block.slice(0);
  if (decrypt) {
    qdyAESAddRoundKey(state, expanded, 10);
    for (var round = 9; round > 0; round -= 1) {
      qdyAESShiftRows(state, true);
      qdyAESSubBytes(state, true);
      qdyAESAddRoundKey(state, expanded, round);
      qdyAESMixColumns(state, true);
    }
    qdyAESShiftRows(state, true);
    qdyAESSubBytes(state, true);
    qdyAESAddRoundKey(state, expanded, 0);
  } else {
    qdyAESAddRoundKey(state, expanded, 0);
    for (var encryptRound = 1; encryptRound <= 10; encryptRound += 1) {
      qdyAESSubBytes(state, false);
      qdyAESShiftRows(state, false);
      if (encryptRound !== 10) qdyAESMixColumns(state, false);
      qdyAESAddRoundKey(state, expanded, encryptRound);
    }
  }
  return state;
}

function qdyAESECB(bytes, key, decrypt) {
  var input = bytes.slice(0);
  if (!decrypt) {
    var padding = 16 - (input.length % 16);
    for (var padIndex = 0; padIndex < padding; padIndex += 1) {
      input.push(padding);
    }
  } else if (!input.length || input.length % 16) {
    throw new Error("AES 密文长度无效");
  }
  var output = [];
  for (var offset = 0; offset < input.length; offset += 16) {
    output = output.concat(qdyAESBlock(input.slice(offset, offset + 16), key, decrypt));
  }
  if (decrypt) {
    var paddingLength = output[output.length - 1];
    if (paddingLength < 1 || paddingLength > 16) {
      throw new Error("AES 填充无效");
    }
    output = output.slice(0, output.length - paddingLength);
  }
  return output;
}

var qdyKuwoAESKey = (function() {
  var hex = "7057273dc7fa29bf39442d72dd5e8ce4";
  return hex.match(/.{2}/g).map(function(value) {
    return parseInt(value, 16);
  });
})();

function qdyKuwoEncrypt(value) {
  return qdyBase64FromBytes(
    qdyAESECB(qdyUTF8Bytes(value), qdyKuwoAESKey, false)
  );
}

function qdyKuwoDecrypt(value) {
  return qdyUTF8String(
    qdyAESECB(qdyBytesFromBase64(decodeURIComponent(qdyText(value))), qdyKuwoAESKey, true)
  );
}

function qdyWithTimeout(promise) {
  return Promise.resolve(promise).catch(function () {
    return null;
  });
}

function qdySearchText(params) {
  params = params || {};
  return qdyFirstText(
    params.keyword,
    params.query,
    params.title,
    params.name,
    params.search
  );
}

function qdyQualityLabel(quality) {
  if (quality === "24bit") return "24bit / Hi-Res";
  if (quality === "flac") return "无损 FLAC";
  if (quality === "128k") return "128K MP3";
  return "320K MP3";
}

function qdyDurationText(value) {
  var total = Math.max(0, Math.floor(Number(value || 0)));
  var hours = Math.floor(total / 3600);
  var minutes = Math.floor((total % 3600) / 60);
  var seconds = total % 60;
  return hours
    ? [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
      ].join(":")
    : [
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
      ].join(":");
}

function qdyFormatFromURL(value) {
  var match = qdyText(value).match(/\.(flac|mp3|m4a|aac|ogg|wav)(?:[?#]|$)/i);
  if (!match) {
    if (/\/kw\.php\?/i.test(value)) {
      if (/lossless/i.test(value)) return "flac";
    }
    return "";
  }
  return match[1].toUpperCase();
}

function qdyNormalizeSong(value) {
  return qdyStripTags(value)
    .replace(/\(\s*live\s*\)/gi, "")
    .replace(/（\s*live\s*）/gi, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/[^\w\u3400-\u9fff]+/g, "")
    .toLowerCase();
}

function qdySongMatch(left, right) {
  var a = qdyNormalizeSong(left);
  var b = qdyNormalizeSong(right);
  if (!a || !b) return true;
  return a.indexOf(b) >= 0 || b.indexOf(a) >= 0;
}

function qdyArtistText(value) {
  if (Array.isArray(value)) {
    return value
      .map(function (artist) {
        if (artist && typeof artist === "object") {
          return qdyText(artist.name || artist.singerName || artist.artistName);
        }
        return qdyText(artist);
      })
      .filter(Boolean)
      .join(" / ");
  }
  if (value && typeof value === "object") {
    return qdyText(value.name || value.singerName || value.artistName);
  }
  return qdyStripTags(value);
}

function qdyAvailableQuality(value) {
  var text = qdyText(value).toUpperCase();
  var result = [];
  if (/MP3|320|HIGH/.test(text)) result.push("320K");
  if (/FLAC|LOSSLESS|SQ|无损/.test(text)) result.push("FLAC");
  if (/24BIT|HI-?RES|HR|MASTER/.test(text)) result.push("Hi-Res");
  if (!result.length) result.push("可用音质由平台决定");
  return result;
}

function qdyTrackLink(track, collectionKey, episodeNumber) {
  return (
    "quandouya:track?" +
    qdyQuery({
      src: track.source,
      id: track.id,
      t: track.title,
      a: track.artist,
      al: track.album,
      mid: track.qqMid,
      media: track.qqMediaMid,
      hash: track.kugouHash,
      hash320: track.kugou320Hash,
      hashsq: track.kugouSqHash,
      cid: track.copyrightId,
      duration: track.duration,
      lyric: track.lyricUrl,
      key: collectionKey,
      ep: episodeNumber
    })
  );
}

function qdyPublicTrack(track, categoryTitle, collectionKey, episodeNumber) {
  var cover = qdyImage(track.cover, 500);
  var link = qdyTrackLink(track, collectionKey, episodeNumber);
  var sourceName = track.sourceName || qdySourceName(track.source);
  var description = [
    track.artist || "未知歌手",
    track.album || "",
    sourceName,
    track.quality || ""
  ]
    .filter(Boolean)
    .join(" · ");

  var item = {
    id: link,
    type: "url",
    title: track.title || "未知歌曲",
    originalTitle: track.title || "未知歌曲",
    description: description,
    posterPath: cover,
    detailPoster: cover,
    backdropPath: cover,
    backdropPaths: [cover],
    coverUrl: cover,
    rating: Number(track.rating || 0),
    mediaType: collectionKey ? "tv" : "movie",
    genreTitle: qdyText(categoryTitle) || sourceName,
    genreItems: [sourceName, categoryTitle || ""]
      .filter(Boolean)
      .map(function (title, index) {
        return {
          id: "quandouya-genre-" + index + "-" + qdyNormalizeSong(title),
          title: title
        };
      }),
    peoples: track.artist
      ? [{
          id:
            "quandouya-artist-" +
            qdyFirstText(
              track.id,
              track.qqMid,
              track.kugouHash,
              qdyNormalizeSong(track.artist),
              "artist"
            ),
          title: track.artist,
          name: track.artist,
          role: "歌手"
        }]
      : [],
    year: track.year || "",
    country: "",
    language: track.language || "",
    duration: Number(track.duration || 0),
    durationText: qdyDurationText(track.duration),
    season: 1,
    episode: Number(episodeNumber || 1),
    link: link,
    externalUrl: qdyText(track.externalUrl),
    playerType: qdyRuntime.playerType,
    source: "全豆要音源",
    musicSource: track.source,
    musicSourceName: sourceName,
    trackId: qdyText(track.id),
    songmid: qdyText(track.qqMid),
    mediaMid: qdyText(track.qqMediaMid),
    hash: qdyText(track.kugouHash),
    albumName: qdyText(track.album),
    copyrightId: qdyText(track.copyrightId),
    lyricUrl: qdyText(track.lyricUrl),
    hasLyrics: true,
    subtitleLabel: "LRC 歌词",
    availableQuality: track.availableQuality || []
  };
  if (!collectionKey) {
    delete item.season;
    delete item.episode;
  }
  return item;
}

function qdyNormalizeNetease(raw) {
  raw = raw || {};
  var albumObject = raw.al || raw.album || {};
  var artists = raw.ar || raw.artists || raw.artist || [];
  var album = qdyText(albumObject.name || raw.albumName || raw.album);
  var duration = Number(raw.dt || raw.duration || 0);
  if (duration > 10000) duration = Math.round(duration / 1000);
  var pic =
    albumObject.picUrl ||
    albumObject.blurPicUrl ||
    raw.pic ||
    raw.cover ||
    "";
  var qualityFlags = [
    raw.h || raw.l ? "320K" : "",
    raw.sq ? "FLAC" : "",
    raw.hr ? "Hi-Res" : ""
  ].filter(Boolean);

  return {
    source: "netease",
    sourceName: "网易云音乐",
    id: qdyText(raw.id || raw.url_id),
    title: qdyStripTags(raw.name || raw.title || "未知歌曲"),
    artist: qdyArtistText(artists),
    album: album,
    cover: qdyImage(pic, 500),
    duration: duration,
    rating: Number(raw.pop || 0) / 10,
    quality: qualityFlags.join(" / "),
    availableQuality: qualityFlags,
    externalUrl:
      "https://music.163.com/#/song?id=" +
      encodeURIComponent(qdyText(raw.id || raw.url_id))
  };
}

async function qdySearchNetease(keyword, page, limit) {
  var url =
    QDY_NETEASE_WEB +
    "/cloudsearch/pc?" +
    qdyQuery({
      s: keyword,
      type: 1,
      limit: limit,
      offset: (page - 1) * limit
    });
  try {
    var data = await qdyGetJSON(url, {
      Referer: "https://music.163.com/"
    });
    var songs = (data.result && data.result.songs) || [];
    if (songs.length) {
      return songs.map(qdyNormalizeNetease).filter(function (track) {
        return track.id;
      });
    }
  } catch (error) {
    console.log("[forward.quandouya] 网易云网页搜索失败，切换星海接口:", qdySafeError(error));
  }

  var fallbackURL =
    QDY_NETEASE_API.replace("api.php?", "api.php?") +
    "&" +
    qdyQuery({
      types: "search",
      source: "netease",
      name: keyword,
      count: limit,
      pages: page
    });
  var fallbackData = await qdyGetJSON(fallbackURL, {
    Referer: "https://music.gdstudio.xyz/"
  });
  var fallbackSongs = Array.isArray(fallbackData)
    ? fallbackData
    : (fallbackData.data || []);
  return fallbackSongs.map(qdyNormalizeNetease).filter(function (track) {
    return track.id;
  });
}

function qdyNormalizeQQ(raw) {
  raw = raw || {};
  var singers = raw.singer || raw.singers || [];
  var album = raw.albumname || raw.albumName || "";
  var albumMid = raw.albummid || raw.albumMid || "";
  var cover =
    raw.albumPic ||
    (albumMid
      ? "https://y.gtimg.cn/music/photo_new/T002R500x500M000" + albumMid + ".jpg"
      : "");
  var quality = [];
  if (raw.size320) quality.push("320K");
  if (raw.sizeflac || raw.sizeape) quality.push("FLAC");

  return {
    source: "qq",
    sourceName: "QQ 音乐",
    id: qdyText(raw.songmid || raw.mid),
    qqMid: qdyText(raw.songmid || raw.mid),
    qqMediaMid: qdyText(raw.media_mid || raw.mediaMid || raw.songmid || raw.mid),
    title: qdyStripTags(raw.songname || raw.title || raw.name || "未知歌曲"),
    artist: qdyArtistText(singers),
    album: qdyStripTags(album),
    cover: qdyImage(cover, 500),
    duration: Number(raw.interval || raw.duration || 0),
    rating: Number(raw.popularity || raw.listenCount || 0) / 100000,
    quality: quality.join(" / "),
    availableQuality: quality,
    externalUrl:
      "https://y.qq.com/n/ryqq/songDetail/" +
      encodeURIComponent(qdyText(raw.songmid || raw.mid))
  };
}

async function qdySearchQQ(keyword, page, limit) {
  var url =
    QDY_QQ_SEARCH +
    "?" +
    qdyQuery({
      format: "json",
      inCharset: "utf8",
      outCharset: "utf-8",
      notice: 0,
      platform: "yqq.json",
      needNewCode: 0,
      w: keyword,
      p: page,
      n: limit
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://y.qq.com/"
  });
  var songs = (data.data && data.data.song && data.data.song.list) || [];
  return songs.map(qdyNormalizeQQ).filter(function (track) {
    return track.id;
  });
}

function qdyKuwoID(value) {
  var match = qdyText(value).match(/(\d+)/);
  return match ? match[1] : "";
}

function qdyNormalizeKuwo(raw) {
  raw = raw || {};
  var id = qdyKuwoID(raw.MUSICRID || raw.DC_TARGETID || raw.id || raw.rid);
  var title = qdyStripTags(
    raw.SONGNAME || raw.NAME || raw.name || raw.song || "未知歌曲"
  );
  var artist = qdyStripTags(raw.ARTIST || raw.artist || raw.singer || "");
  var album = qdyStripTags(raw.ALBUM || raw.album || "");
  var cover = qdyImage(
    raw.picture ||
      raw.pic300 ||
      raw.pic ||
      raw.PICPATH ||
      "",
    500
  );
  var quality = qdyAvailableQuality(
    raw.N_MINFO ||
      raw.nMinfo ||
      raw.MINFO ||
      raw.minfo ||
      raw.FORMATS
  );

  return {
    source: "kuwo",
    sourceName: "酷我音乐",
    id: id,
    title: title,
    artist: artist,
    album: album,
    cover: cover,
    duration: Number(raw.DURATION || raw.duration || raw.time || 0),
    rating: Number(raw.SCORE100 || raw.PLAYCNT || raw.play || 0) / 10,
    language: qdyStripTags(raw.language || ""),
    quality: quality.join(" / "),
    availableQuality: quality,
    externalUrl:
      "https://www.kuwo.cn/play_detail/" + encodeURIComponent(id)
  };
}

async function qdySearchKuwo(keyword, page, limit) {
  var url =
    QDY_KUWO_SEARCH +
    "?" +
    qdyQuery({
      all: keyword,
      ft: "music",
      itemset: "web_2013",
      client: "kt",
      pn: page - 1,
      rn: limit,
      rformat: "json",
      encoding: "utf8"
    });
  var raw = await qdyRequest("GET", url, null, {
    Referer: "https://www.kuwo.cn/"
  });
  var data = qdyLooseJSON(raw);
  var songs = data.abslist || data.data || [];
  return songs.map(qdyNormalizeKuwo).filter(function (track) {
    return track.id && track.title;
  });
}

function qdyNormalizeKugou(raw) {
  raw = raw || {};
  var quality = [];
  if (raw.HQFileHash || raw.FileHash) quality.push("320K");
  if (raw.SQFileHash) quality.push("FLAC");
  if (raw.SuperFileHash) quality.push("Hi-Res");
  var cover =
    raw.Image ||
    (raw.trans_param && raw.trans_param.union_cover) ||
    raw.AlbumImage ||
    "";
  cover = qdyText(cover).replace(/\{size\}/g, "480");

  return {
    source: "kugou",
    sourceName: "酷狗音乐",
    id: qdyText(raw.FileHash || raw.HQFileHash || raw.SQFileHash),
    title: qdyStripTags(raw.SongName || raw.SongNameOriginal || "未知歌曲"),
    artist: qdyStripTags(raw.SingerName || qdyArtistText(raw.Singers)),
    album: qdyStripTags(raw.AlbumName || ""),
    cover: qdyImage(cover, 500),
    duration: Number(raw.Duration || raw.HQDuration || raw.SQDuration || 0),
    rating: Number(raw.HeatLevel || 0),
    language:
      raw.trans_param && raw.trans_param.language
        ? qdyStripTags(raw.trans_param.language)
        : "",
    kugouHash: qdyText(raw.FileHash),
    kugou320Hash: qdyText(raw.HQFileHash),
    kugouSqHash: qdyText(raw.SQFileHash),
    quality: quality.join(" / "),
    availableQuality: quality,
    externalUrl:
      "https://www.kugou.com/song/#hash=" +
      encodeURIComponent(qdyText(raw.FileHash))
  };
}

async function qdySearchKugou(keyword, page, limit) {
  var url =
    QDY_KUGOU_SEARCH +
    "?" +
    qdyQuery({
      keyword: keyword,
      page: page,
      pagesize: limit,
      platform: "WebFilter",
      userid: 0,
      clientver: 2000,
      iscorrection: 1,
      privilege_filter: 0,
      filter: 10
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://www.kugou.com/"
  });
  var songs = (data.data && data.data.lists) || [];
  return songs.map(qdyNormalizeKugou).filter(function (track) {
    return track.id && track.title;
  });
}

function qdyMiguCover(raw) {
  var pictures =
    (raw.albumImgs && raw.albumImgs.length && raw.albumImgs) ||
    (raw.imgItems && raw.imgItems.length && raw.imgItems) ||
    [];
  if (!pictures.length) return "";
  var picture = pictures[pictures.length - 1] || pictures[0] || {};
  return qdyText(picture.img || picture.image || picture.url);
}

function qdyMiguDuration(value) {
  var text = qdyText(value);
  if (!text) return 0;
  if (/^\d+$/.test(text)) return Number(text);
  var parts = text.split(":").map(function(part) {
    return parseInt(part, 10);
  });
  if (
    parts.length < 2 ||
    parts.some(function(part) {
      return !isFinite(part) || part < 0;
    })
  ) {
    return 0;
  }
  return parts.reduce(function(total, part) {
    return total * 60 + part;
  }, 0);
}

function qdyNormalizeMigu(raw) {
  raw = raw || {};
  var rateFormats = raw.rateFormats || [];
  var quality = rateFormats
    .map(function (item) {
      return qdyText(item.formatType || item.format);
    })
    .filter(Boolean);
  if (!quality.length) quality = ["平台可播"];

  return {
    source: "migu",
    sourceName: "咪咕音乐",
    id: qdyText(raw.contentId || raw.id || raw.songId),
    title: qdyStripTags(raw.name || raw.songName || "未知歌曲"),
    artist: qdyArtistText(raw.singers || raw.singer || ""),
    album: qdyText(
      raw.albums && raw.albums[0] && raw.albums[0].name
        ? raw.albums[0].name
        : raw.album || ""
    ),
    cover: qdyImage(qdyMiguCover(raw), 500),
    duration: qdyMiguDuration(raw.length || raw.duration),
    rating: 0,
    language: Array.isArray(raw.tagList)
      ? qdyText(
          (raw.tagList.find(function(tag) {
            return tag && /语/.test(qdyText(tag.tagName));
          }) || {}).tagName
        )
      : Array.isArray(raw.tags)
        ? qdyText(raw.tags[0])
        : "",
    copyrightId: qdyText(raw.copyrightId),
    lyricUrl: qdyText(raw.lrcUrl || raw.lyricUrl),
    quality: quality.join(" / "),
    availableQuality: quality,
    externalUrl:
      "https://music.migu.cn/v3/music/song/" +
      encodeURIComponent(qdyText(raw.contentId || raw.id))
  };
}

async function qdySearchMigu(keyword, page, limit) {
  var searchSwitch = JSON.stringify({
    song: 1,
    album: 0,
    singer: 0,
    tag: 0,
    mv: 0,
    playlist: 0
  });
  var url =
    QDY_MIGU_SEARCH +
    "?" +
    qdyQuery({
      text: keyword,
      pageNo: page,
      pageSize: limit,
      searchSwitch: searchSwitch
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://music.migu.cn/"
  });
  var songs =
    (data.songResultData && data.songResultData.result) ||
    (data.data && data.data.result) ||
    [];
  return songs.map(qdyNormalizeMigu).filter(function (track) {
    return track.id && track.title;
  });
}

function qdyQishuiQuality(value) {
  var quality = qdyQuality(value);
  if (quality === "128k") return "low";
  if (quality === "320k") return "standard";
  if (quality === "flac") return "lossless";
  return "flac24bit";
}

function qdyNormalizeQishui(raw) {
  raw = raw || {};
  return {
    source: "qishui",
    sourceName: "汽水音乐",
    id: qdyText(raw.id || raw.songId || raw.trackId),
    title: qdyStripTags(raw.name || raw.title || "未知歌曲"),
    artist: qdyArtistText(raw.artists || raw.singer || raw.artist),
    album: qdyText(raw.album || raw.albumName),
    cover: qdyImage(raw.cover || raw.pic || raw.coverUrl, 500),
    duration: Number(raw.duration || 0),
    rating: 0,
    language: "",
    quality: "汽水接口音质",
    availableQuality: ["汽水接口音质"],
    externalUrl: ""
  };
}

async function qdySearchQishui(keyword, page, limit) {
  var url =
    QDY_QISHUI_API +
    "?" +
    qdyQuery({
      act: "search",
      keywords: keyword,
      page: page,
      pagesize: limit,
      type: "music"
    });
  var data = await qdyGetJSON(url);
  var songs =
    (data.data && data.data.lists) ||
    (data.data && data.data.list) ||
    [];
  return songs.map(qdyNormalizeQishui).filter(function (track) {
    return track.id && track.title;
  });
}

async function qdySearchSource(source, keyword, page, limit) {
  var tracks = [];
  if (source === "netease") tracks = await qdySearchNetease(keyword, page, limit);
  else if (source === "qq") tracks = await qdySearchQQ(keyword, page, limit);
  else if (source === "kuwo") tracks = await qdySearchKuwo(keyword, page, limit);
  else if (source === "kugou") tracks = await qdySearchKugou(keyword, page, limit);
  else if (source === "migu") tracks = await qdySearchMigu(keyword, page, limit);
  else if (source === "qishui") tracks = await qdySearchQishui(keyword, page, limit);
  return tracks.slice(0, limit);
}

function qdyDedupe(items, limit) {
  var seen = {};
  var result = [];
  for (var index = 0; index < items.length; index += 1) {
    var item = items[index];
    var key = [
      qdyNormalizeSong(item.title),
      qdyNormalizeSong(item.artist)
    ].join("|");
    if (seen[key]) continue;
    seen[key] = true;
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

async function searchQdy(params) {
  params = qdyApplySettings(params || {});
  var keyword = qdySearchText(params);
  if (!keyword) return [];
  var page = qdyPage(params.page);
  var limit = qdyLimit(params);
  var source = qdySource(params.source, "all") || "all";
  if (source !== "all") {
    var sourceTracks = await qdySearchSource(source, keyword, page, limit);
    return sourceTracks.map(function (track) {
      return qdyPublicTrack(track, "搜索 · " + qdySourceName(source));
    });
  }

  var providers = ["netease", "qq", "kuwo", "kugou", "migu"];
  var perProvider = Math.max(6, Math.ceil(limit / providers.length));
  var errors = [];
  var settled = await Promise.all(
    providers.map(function (provider) {
      return qdySearchSource(provider, keyword, page, perProvider).catch(function (error) {
        errors.push(qdySourceName(provider) + ": " + qdySafeError(error));
        return [];
      });
    })
  );
  var merged = [];
  var maxLength = settled.reduce(function (maximum, group) {
    return Math.max(maximum, group.length);
  }, 0);
  for (var index = 0; index < maxLength; index += 1) {
    settled.forEach(function (group) {
      if (group[index]) merged.push(group[index]);
    });
  }
  merged = qdyDedupe(merged, limit);
  if (!merged.length && errors.length) {
    throw new Error("所有平台搜索均失败: " + errors.join("; "));
  }
  return merged.map(function (track) {
    return qdyPublicTrack(track, "全平台搜索");
  });
}

function qdyChartPlatform(value) {
  var platform = qdyText(value).toLowerCase();
  return qdyChartCatalog[platform] ? platform : "";
}

function qdyChartPlatformName(platform) {
  return qdyChartCatalog[platform] && qdyChartCatalog[platform].name
    ? qdyChartCatalog[platform].name
    : platform;
}

function qdyChartLink(platform, boardId, boardName) {
  return (
    "quandouya:chart?" +
    qdyQuery({
      src: platform,
      chart: boardId,
      name: boardName
    })
  );
}

function qdyChartBoard(platform, board) {
  var link = qdyChartLink(platform, board.id, board.name);
  var platformName = qdyChartPlatformName(platform);
  return {
    id: link,
    type: "url",
    title: board.name,
    originalTitle: board.name,
    description: platformName + " · 实时榜单 · 全豆要音源",
    posterPath: QDY_ICON,
    detailPoster: QDY_ICON,
    backdropPath: QDY_ICON,
    backdropPaths: [QDY_ICON],
    coverUrl: QDY_ICON,
    rating: 0,
    mediaType: "other",
    genreTitle: platformName,
    genreItems: [],
    peoples: [],
    link: link,
    externalUrl: link,
    source: "全豆要音源",
    musicSource: platform
  };
}

function qdyChartBoardList(platform) {
  var group = qdyChartCatalog[platform];
  if (!group) return [];
  return group.boards.map(function(board) {
    return qdyChartBoard(platform, board);
  });
}

function qdyChartKugouTrack(raw) {
  raw = raw || {};
  var authors = Array.isArray(raw.authors)
    ? raw.authors.map(function(author) {
        return author && (author.author_name || author.name);
      })
    : raw.SingerName;
  var cover =
    (raw.trans_param && raw.trans_param.union_cover) ||
    raw.album_sizable_cover ||
    raw.Image ||
    "";
  return qdyNormalizeKugou({
    FileHash: raw.hash,
    HQFileHash: raw["320hash"] || raw.hash_high || raw.hash,
    SQFileHash: raw.sqhash,
    SuperFileHash: raw.hash_super,
    SongName: raw.songname || raw.filename || "未知歌曲",
    SingerName: qdyArtistText(authors),
    AlbumName: raw.album_name || "",
    Image: cover,
    Duration: Number(raw.duration || 0),
    HeatLevel: Number(raw.rank_count || raw.sort || 0),
    trans_param: raw.trans_param
  });
}

async function qdyKugouChart(boardId, limit) {
  var tracks = [];
  var pageSize = 100;
  var page = 1;
  while (tracks.length < limit) {
    var count = Math.min(pageSize, limit - tracks.length);
    var url =
      QDY_KUGOU_CHART +
      "?" +
      qdyQuery({
        rankid: boardId,
        page: page,
        pagesize: count,
        version: 9108,
        ranktype: 1,
        plat: 0,
        area_code: 1,
        with_res_tag: 0,
        show_portrait_mv: 1
      });
    var data = await qdyGetJSON(url, {
      Referer: "https://www.kugou.com/",
      "User-Agent": QDY_USER_AGENT
    });
    if (Number(data.errcode) !== 0) {
      throw new Error(data.error || "酷狗榜单接口失败");
    }
    var songs = (data.data && data.data.info) || [];
    if (!songs.length) break;
    tracks = tracks.concat(
      songs.map(qdyChartKugouTrack).filter(function(track) {
        return track.id && track.title;
      })
    );
    if (songs.length < count) break;
    page += 1;
  }
  return tracks;
}

function qdyChartQQTrack(raw) {
  raw = raw || {};
  var album = raw.album || {};
  var file = raw.file || {};
  return qdyNormalizeQQ({
    songmid: raw.mid || raw.songmid,
    mid: raw.mid || raw.songmid,
    media_mid: file.media_mid,
    songname: raw.name || raw.title || "未知歌曲",
    singer: raw.singer || raw.singers || [],
    albumname: album.name || raw.albumname || "",
    albummid: album.mid || raw.albummid || "",
    interval: raw.interval || 0,
    popularity: raw.index || raw.listenCount || 0,
    size320: file.size_320mp3 || 0,
    sizeflac: file.size_flac || 0
  });
}

async function qdyQQChartPeriods() {
  var cached = qdyChartCache.qqPeriods;
  if (cached && Date.now() - cached.timestamp < 1800000) {
    return cached.values;
  }
  var values = {};
  try {
    var html = qdyText(
      await qdyRequest("GET", "https://c.y.qq.com/node/pc/wk_v15/top.html", null, {
        Referer: "https://y.qq.com/"
      })
    );
    var pattern =
      /data-tid="(?:top|global)\/(\d+)" data-date="([^"]+)"/g;
    var match;
    while ((match = pattern.exec(html))) {
      if (match[1] && match[2]) values[match[1]] = match[2];
    }
  } catch (error) {
    console.log("[forward.quandouya] QQ 榜单周期读取失败:", qdySafeError(error));
  }
  qdyChartCache.qqPeriods = {
    values: values,
    timestamp: Date.now()
  };
  return values;
}

async function qdyQQChart(boardId, limit) {
  var periods = await qdyQQChartPeriods();
  var payload = {
    comm: {
      uin: 0,
      format: "json",
      ct: 20,
      cv: 1859
    },
    toplist: {
      module: "musicToplist.ToplistInfoServer",
      method: "GetDetail",
      param: {
        topid: Number(boardId),
        num: Math.min(limit, 300),
        period: periods[String(boardId)] || ""
      }
    }
  };
  var data = await qdyPostJSON(QDY_QQ_VKEY, JSON.stringify(payload), {
    "Content-Type": "application/json",
    Referer: "https://y.qq.com/"
  });
  if (Number(data.code) !== 0) {
    throw new Error(data.msg || "QQ 音乐榜单接口失败");
  }
  var songs =
    (data.toplist && data.toplist.data && data.toplist.data.songInfoList) ||
    [];
  return songs.map(qdyChartQQTrack).filter(function(track) {
    return track.id && track.title;
  });
}

async function qdyMiguChart(boardId) {
  var url =
    QDY_MIGU_CHART +
    "?" +
    qdyQuery({
      columnId: boardId,
      needAll: 0
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://music.migu.cn/"
  });
  if (String(data.code) !== "000000") {
    throw new Error(data.info || data.message || "咪咕榜单接口失败");
  }
  var contents =
    (data.columnInfo && data.columnInfo.contents) || [];
  var seen = {};
  return contents
    .map(function(entry) {
      return entry && entry.objectInfo;
    })
    .filter(function(raw) {
      var id = qdyText(raw && (raw.songId || raw.contentId));
      if (!id || seen[id]) return false;
      seen[id] = true;
      return true;
    })
    .map(qdyNormalizeMigu)
    .filter(function(track) {
      return track.id && track.title;
    });
}

async function qdyKuwoChart(boardId, limit) {
  var tracks = [];
  var pageSize = 100;
  var page = 1;
  while (tracks.length < limit) {
    var count = Math.min(pageSize, limit - tracks.length);
    var time = Date.now();
    var encrypted = qdyKuwoEncrypt(
      JSON.stringify({
        uid: "",
        devId: "",
        sFrom: "kuwo_sdk",
        user_type: "AP",
        carSource: "kwplayercar_ar_6.0.1.0_apk_keluze.apk",
        id: String(boardId),
        pn: page - 1,
        rn: count
      })
    );
    var sign = qdyMD5("y67sprxhhpws" + encrypted + time).toUpperCase();
    var url =
      QDY_KUWO_CHART +
      "?" +
      qdyQuery({
        data: encrypted,
        time: time,
        appId: "y67sprxhhpws",
        sign: sign
      });
    var response = qdyText(
      await qdyRequest("GET", url, null, {
        Referer: "https://www.kuwo.cn/",
        "User-Agent": QDY_USER_AGENT
      })
    );
    var data = qdyParseJSON(qdyKuwoDecrypt(response));
    if (Number(data.code) !== 200 || !data.data || !data.data.musiclist) {
      throw new Error(data.message || data.msg || "酷我榜单接口失败");
    }
    var songs = data.data.musiclist || [];
    tracks = tracks.concat(
      songs.map(qdyNormalizeKuwo).filter(function(track) {
        return track.id && track.title;
      })
    );
    if (songs.length < count) break;
    page += 1;
  }
  return tracks;
}

async function qdyChartTracks(params, platform, boardId) {
  params = qdyApplySettings(params || {});
  platform = qdyChartPlatform(platform);
  if (!platform) throw new Error("无法识别榜单平台");
  var configuredLimit = qdyQueueLimit(params);
  var limit = configuredLimit || 300;
  var cacheKey = platform + ":" + boardId + ":" + limit;
  var cached = qdyChartCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < 600000) {
    return cached.tracks;
  }
  var tracks = [];
  if (platform === "wy") {
    tracks = await qdyNeteasePlaylist(
      {
        id: boardId,
        title: "网易云榜单"
      },
      1,
      Math.min(limit, 500)
    );
  } else if (platform === "kg") {
    tracks = await qdyKugouChart(boardId, limit);
  } else if (platform === "tx") {
    tracks = await qdyQQChart(boardId, limit);
  } else if (platform === "mg") {
    tracks = await qdyMiguChart(boardId);
  } else if (platform === "kw") {
    tracks = await qdyKuwoChart(boardId, limit);
  }
  tracks = qdyDedupe(tracks, limit);
  if (!tracks.length) throw new Error("当前榜单没有可播放歌曲");
  qdyChartCache[cacheKey] = {
    tracks: tracks,
    timestamp: Date.now()
  };
  return tracks;
}

function qdyChartCollection(platform, boardId, boardName, tracks) {
  var platformName = qdyChartPlatformName(platform);
  var title = platformName + " · " + boardName;
  var link = qdyChartLink(platform, boardId, boardName);
  var cover = qdyImage((tracks[0] && tracks[0].cover) || "", 500);
  var children = qdyCollectionEpisodes(
    tracks,
    title,
    "chart:" + platform + ":" + boardId
  );
  return {
    id: link,
    type: "url",
    title: title,
    originalTitle: title,
    description:
      children.length +
      " 首榜单歌曲 · 手动切换 / 自动续播 · 全豆要音源",
    posterPath: cover,
    detailPoster: cover,
    backdropPath: cover,
    backdropPaths: cover ? [cover] : [],
    coverUrl: cover,
    rating: 0,
    mediaType: "tv",
    season: 1,
    episode: children.length ? 1 : 0,
    episodeCount: children.length,
    episodeItems: children,
    genreTitle: platformName,
    genreItems: [],
    peoples: [],
    link: link,
    externalUrl: link,
    source: "全豆要音源",
    musicSource: platform
  };
}

async function chartKuwo(params) {
  return qdyChartBoardList("kw");
}

async function chartKugou(params) {
  return qdyChartBoardList("kg");
}

async function chartQQ(params) {
  return qdyChartBoardList("tx");
}

async function chartNetease(params) {
  return qdyChartBoardList("wy");
}

async function chartMigu(params) {
  return qdyChartBoardList("mg");
}

async function qdyNeteasePlaylist(playlist, page, limit) {
  var url =
    QDY_NETEASE_WEB +
    "/v6/playlist/detail?" +
    qdyQuery({ id: playlist.id });
  var data = await qdyGetJSON(url, {
    Referer: "https://music.163.com/"
  });
  var tracks =
    (data.playlist && data.playlist.tracks) ||
    (data.result && data.result.tracks) ||
    [];
  var trackIds =
    (data.playlist && data.playlist.trackIds) ||
    (data.result && data.result.trackIds) ||
    [];
  trackIds = trackIds
    .map(function (entry) {
      return Number(entry && entry.id ? entry.id : entry);
    })
    .filter(function (id) {
      return isFinite(id) && id > 0;
    });
  var trackCount = Number(
    (data.playlist && data.playlist.trackCount) ||
      (data.result && data.result.trackCount) ||
      tracks.length
  );
  if (limit > tracks.length && trackIds.length > tracks.length) {
    var hydratedTracks = [];
    try {
      var wantedIds = trackIds.slice(0, limit);
      for (var idStart = 0; idStart < wantedIds.length; idStart += 400) {
        var idChunk = wantedIds.slice(idStart, idStart + 400);
        var detailURL =
          QDY_NETEASE_WEB +
          "/v3/song/detail?" +
          qdyQuery({
            c: JSON.stringify(
              idChunk.map(function (id) {
                return { id: id };
              })
            )
          });
        var detailData = await qdyGetJSON(detailURL, {
          Referer: "https://music.163.com/"
        });
        hydratedTracks = hydratedTracks.concat(
          (detailData && detailData.songs) || []
        );
      }
      if (hydratedTracks.length) {
        var hydratedById = {};
        hydratedTracks.forEach(function (song) {
          if (song && song.id) hydratedById[String(song.id)] = song;
        });
        var orderedTracks = wantedIds
          .map(function (id) {
            return hydratedById[String(id)];
          })
          .filter(Boolean);
        if (orderedTracks.length > tracks.length) tracks = orderedTracks;
      }
    } catch (error) {
      console.log(
        "[forward.quandouya] 歌单完整歌曲补全失败，继续尝试备用接口:",
        qdySafeError(error)
      );
    }
  }
  if (limit > tracks.length && trackCount > tracks.length) {
    try {
      var fullURL =
        QDY_NETEASE_API +
        "&" +
        qdyQuery({
          types: "playlist",
          source: "netease",
          id: playlist.id
        });
      var fullData = await qdyGetJSON(fullURL, {
        Referer: "https://music.gdstudio.xyz/"
      });
      var fullTracks =
        (fullData.playlist && fullData.playlist.tracks) ||
        (fullData.result && fullData.result.tracks) ||
        [];
      if (fullTracks.length > tracks.length) tracks = fullTracks;
    } catch (error) {
      console.log(
        "[forward.quandouya] 完整歌单读取失败，使用首屏结果:",
        qdySafeError(error)
      );
    }
  }
  var start = (page - 1) * limit;
  return tracks
    .slice(start, start + limit)
    .map(qdyNormalizeNetease)
    .filter(function (track) {
      return track.id;
    });
}

function qdyCollectionLink(key) {
  return (
    "quandouya:collection?" +
    qdyQuery({
      key: key
    })
  );
}

async function qdyCategoryTracks(params, key) {
  params = qdyApplySettings(params || {});
  if (key === "favorites") return qdyLoadFavorites();
  var playlist = qdyPlaylists[key];
  if (!playlist) throw new Error("无法识别音乐分类");
  var configuredLimit = qdyQueueLimit(params);
  var fetchLimit = configuredLimit || 1000;
  var cacheKey = key + "|" + (configuredLimit || "all");
  var cached = qdyCollectionCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < 600000) {
    return cached.tracks;
  }
  var tracks = [];
  try {
    tracks = await qdyNeteasePlaylist(playlist, 1, fetchLimit);
    if (tracks.length) {
      qdyCollectionCache[cacheKey] = {
        tracks: tracks,
        timestamp: Date.now()
      };
      return tracks;
    }
  } catch (error) {
    console.log(
      "[forward.quandouya] 分类歌单读取失败，改按关键词搜索:",
      playlist.title,
      qdySafeError(error)
    );
  }
  tracks = await qdySearchNetease(
    playlist.keyword,
    1,
    fetchLimit
  );
  if (!tracks.length) throw new Error("当前分类没有可播放歌曲");
  qdyCollectionCache[cacheKey] = {
    tracks: tracks,
    timestamp: Date.now()
  };
  return tracks;
}

function qdyCategoryCollectionItem(key, tracks) {
  var playlist = qdyPlaylists[key];
  var first = tracks[0] || {};
  var cover = qdyImage(first.cover || playlist.cover, 500);
  var link = qdyCollectionLink(key);
  var totalCount = tracks.length || Number(playlist.count || 0);
  return {
    id: link,
    type: "url",
    title: playlist.title,
    originalTitle: playlist.title,
    description:
      totalCount +
      " 首歌曲 · 支持任意切换与自动续播 · 全豆要音源",
    posterPath: cover,
    detailPoster: cover,
    backdropPath: cover,
    backdropPaths: cover ? [cover] : [],
    coverUrl: cover,
    rating: 0,
    mediaType: "other",
    genreTitle: playlist.title,
    genreItems: [],
    peoples: [],
    link: link,
    externalUrl: link,
    source: "全豆要音源"
  };
}

function qdyCollectionEpisodes(tracks, categoryTitle, collectionKey) {
  return tracks.map(function (track, index) {
    var item = qdyPublicTrack(track, categoryTitle, collectionKey, index + 1);
    item.season = 1;
    item.episode = index + 1;
    item.episodeNumber = index + 1;
    item.number = index + 1;
    item.mediaType = "tv";
    item.playerType = qdyRuntime.playerType;
    return item;
  });
}

function qdyCompleteCollection(key, tracks) {
  var playlist = qdyPlaylists[key];
  var collection = qdyCategoryCollectionItem(key, tracks);
  var children = qdyCollectionEpisodes(tracks, playlist.title, key);
  collection.mediaType = "tv";
  collection.season = 1;
  collection.episodeCount = children.length;
  collection.episodeItems = children;
  collection.description =
    children.length +
    " 首歌曲 · 手动切换 / 自动续播 · 播放画面同步歌词 · 全豆要音源";
  return collection;
}

function qdyCompleteFavoriteCollection(tracks) {
  var records = tracks || qdyLoadFavorites();
  var cover = qdyImage((records[0] && records[0].cover) || "", 500);
  var link = qdyCollectionLink("favorites");
  var children = qdyCollectionEpisodes(records, "我的收藏", "favorites");
  return {
    id: link,
    type: "url",
    title: "我的收藏",
    originalTitle: "我的收藏",
    description:
      children.length +
      " 首自定义收藏 · 支持连续播放与自动续播 · 全豆要音源",
    posterPath: cover,
    detailPoster: cover,
    backdropPath: cover,
    backdropPaths: cover ? [cover] : [],
    coverUrl: cover,
    rating: 0,
    mediaType: "tv",
    season: 1,
    episode: children.length ? 1 : 0,
    episodeCount: children.length,
    episodeItems: children,
    genreTitle: "我的收藏",
    genreItems: [],
    peoples: [],
    link: link,
    externalUrl: link,
    source: "全豆要音源"
  };
}

async function qdyCategory(params, key) {
  params = qdyApplySettings(params || {});
  var tracks = await qdyCategoryTracks(params, key);
  var playlist = qdyPlaylists[key];
  return tracks.map(function (track, index) {
    return qdyPublicTrack(
      track,
      playlist.title,
      key,
      index + 1
    );
  });
}

async function loadDetail(link, params) {
  params = qdyApplySettings(params || {});
  var raw =
    link && typeof link === "object"
      ? qdyFirstText(link.link, link.externalUrl, link.id)
      : qdyText(link);
  if (raw.indexOf("quandouya:chart?") === 0) {
    var chartParams = qdyParseLink(raw);
    var chartPlatform = qdyChartPlatform(chartParams.src);
    var chartBoardId = qdyText(chartParams.chart);
    var chartBoardName = qdyText(chartParams.name) || "音乐榜单";
    if (!chartPlatform || !chartBoardId) {
      throw new Error("无法识别音乐榜单详情");
    }
    var chartTracks = await qdyChartTracks(
      params,
      chartPlatform,
      chartBoardId
    );
    var chartCollection = qdyChartCollection(
      chartPlatform,
      chartBoardId,
      chartBoardName,
      chartTracks
    );
    chartCollection.relatedItems = qdyFavoriteActionItems(chartTracks[0]);
    return chartCollection;
  }
  if (raw.indexOf("quandouya:favorites-help") === 0) {
    return qdyFavoriteHelpItem(
      "收藏使用说明",
      "在“收藏管理”中选择添加收藏，输入歌名和歌手后刷新。收藏成功后，“我的收藏”会显示歌曲，并支持连续播放。"
    );
  }
  if (raw.indexOf("quandouya:favorite-action?") === 0) {
    return qdyHandleFavoriteAction(raw);
  }
  var parsed = qdyParseLink(raw);
  if (parsed.src) {
    if (parsed.key === "favorites") {
      var favoriteTracks = qdyLoadFavorites();
      var favoriteCollection = qdyCompleteFavoriteCollection(favoriteTracks);
      var favoriteEpisode = parseInt(parsed.ep, 10);
      if (isFinite(favoriteEpisode) && favoriteEpisode > 0) {
        favoriteCollection.episode = favoriteEpisode;
      }
      favoriteCollection.relatedItems = qdyFavoriteActionItems(
        favoriteTracks[Math.max(1, favoriteEpisode || 1) - 1]
      );
      return favoriteCollection;
    }
    if (parsed.key && qdyPlaylists[parsed.key]) {
      var queueTracks = await qdyCategoryTracks(params, parsed.key);
      var collection = qdyCompleteCollection(parsed.key, queueTracks);
      var selectedEpisode = parseInt(parsed.ep, 10);
      if (isFinite(selectedEpisode) && selectedEpisode > 0) {
        collection.episode = selectedEpisode;
      }
      collection.relatedItems = qdyFavoriteActionItems(
        queueTracks[Math.max(1, selectedEpisode || 1) - 1]
      );
      return collection;
    }
    var trackItem = qdyTrackFromParams({ link: raw });
    var trackDetail = qdyPublicTrack(trackItem, "全豆要音源");
    trackDetail.relatedItems = qdyFavoriteActionItems(trackItem);
    return trackDetail;
  }
  var key = qdyText(parsed.key);
  if (key === "favorites") {
    var savedTracks = qdyLoadFavorites();
    var savedCollection = qdyCompleteFavoriteCollection(savedTracks);
    savedCollection.relatedItems = qdyFavoriteActionItems(savedTracks[0]);
    return savedCollection;
  }
  if (!key || !qdyPlaylists[key]) {
    throw new Error("无法识别音乐分类详情");
  }
  var tracks = await qdyCategoryTracks(params, key);
  return qdyCompleteCollection(key, tracks);
}

async function latestAllV2(params) {
  return qdyCategory(params, "latestAll");
}

async function categoryMandarinV2(params) {
  return qdyCategory(params, "categoryMandarin");
}

async function categoryWesternV2(params) {
  return qdyCategory(params, "categoryWestern");
}

async function categoryCantoneseV2(params) {
  return qdyCategory(params, "categoryCantonese");
}

async function categoryInstrumentalV2(params) {
  return qdyCategory(params, "categoryInstrumental");
}

async function categoryElectronicV2(params) {
  return qdyCategory(params, "categoryElectronic");
}

async function categoryRockV2(params) {
  return qdyCategory(params, "categoryRock");
}

async function categoryFolkV2(params) {
  return qdyCategory(params, "categoryFolk");
}

function qdyParseLink(value) {
  var raw = qdyText(value);
  var question = raw.indexOf("?");
  if (raw.indexOf("quandouya:") < 0 || question < 0) return {};
  var result = {};
  raw
    .slice(question + 1)
    .split("&")
    .forEach(function (part) {
      if (!part) return;
      var separator = part.indexOf("=");
      var key = separator >= 0 ? part.slice(0, separator) : part;
      var value = separator >= 0 ? part.slice(separator + 1) : "";
      try {
        result[decodeURIComponent(key)] = decodeURIComponent(value);
      } catch (error) {
        result[key] = value;
      }
    });
  return result;
}

function qdyHasTrackIdentity(value) {
  var parsed = qdyParseLink(value);
  return Boolean(
    parsed.src &&
      (parsed.id || parsed.mid || parsed.hash || parsed.t || parsed.a)
  );
}

function qdyTrackFromParams(params) {
  params = params || {};
  var objects = [
    params.link,
    params.item,
    params.resource,
    params.episode,
    params.media,
    params.track,
    params.externalUrl,
    params.id
  ];
  var record = params;
  for (var index = 0; index < objects.length; index += 1) {
    if (objects[index] && typeof objects[index] === "object") {
      record = objects[index];
      break;
    }
    if (
      typeof objects[index] === "string" &&
      /^\s*\{/.test(objects[index])
    ) {
      try {
        record = JSON.parse(objects[index]);
        break;
      } catch (error) {}
    }
  }
  var linkCandidates = [
    typeof record.link === "string" ? record.link : "",
    typeof record.externalUrl === "string" ? record.externalUrl : "",
    typeof record.id === "string" ? record.id : "",
    typeof params.link === "string" ? params.link : "",
    typeof params.url === "string" && params.url.indexOf("quandouya:") === 0
      ? params.url
      : "",
    typeof params.id === "string" ? params.id : "",
    typeof params.externalUrl === "string" ? params.externalUrl : ""
  ];
  var linkValue = "";
  for (var linkIndex = 0; linkIndex < linkCandidates.length; linkIndex += 1) {
    if (qdyHasTrackIdentity(linkCandidates[linkIndex])) {
      linkValue = qdyText(linkCandidates[linkIndex]);
      break;
    }
  }
  if (!linkValue) linkValue = qdyFirstText.apply(null, linkCandidates);
  var parsed = qdyParseLink(linkValue);
  var source = qdySource(
    parsed.src ||
      record.musicSource ||
      record.trackSource ||
      record.source ||
      params.musicSource ||
      params.trackSource ||
      params.source,
    ""
  );
  return {
    link: linkValue,
    source: source,
    id: qdyFirstText(
      parsed.id,
      record.trackId,
      record.musicId,
      record.songId,
      params.trackId,
      params.musicId,
      params.songId,
      parsed.id
    ),
    title: qdyFirstText(
      parsed.t,
      record.title,
      record.name,
      record.songName,
      params.title,
      params.name,
      params.songName
    ),
    artist: qdyFirstText(
      parsed.a,
      record.artist,
      record.singer,
      record.artists,
      params.artist,
      params.singer,
      params.artists
    ),
    album: qdyFirstText(
      parsed.al,
      record.album,
      record.albumName,
      params.album,
      params.albumName
    ),
    qqMid: qdyFirstText(
      parsed.mid,
      record.songmid,
      record.qqMid,
      params.songmid,
      params.qqMid
    ),
    qqMediaMid: qdyFirstText(
      parsed.media,
      record.mediaMid,
      params.mediaMid
    ),
    kugouHash: qdyFirstText(parsed.hash, record.hash, params.hash),
    kugou320Hash: qdyFirstText(record.hash320, params.hash320),
    kugouSqHash: qdyFirstText(record.hashsq, params.hashsq),
    copyrightId: qdyFirstText(
      parsed.cid,
      record.copyrightId,
      params.copyrightId
    ),
    lyricUrl: qdyFirstText(parsed.lyric, record.lyricUrl, params.lyricUrl),
    duration: Number(
      qdyFirstText(parsed.duration, record.duration, params.duration) || 0
    ),
    cover: qdyFirstText(
      record.coverUrl,
      record.cover,
      record.posterPath,
      params.coverUrl,
      params.cover,
      params.posterPath
    )
  };
}

function qdyFavoriteStorageAvailable() {
  return (
    Widget.storage &&
    typeof Widget.storage.get === "function" &&
    typeof Widget.storage.set === "function"
  );
}

function qdyFavoriteRecord(track) {
  track = track || {};
  return {
    source: qdySource(track.source, ""),
    id: qdyText(track.id),
    title: qdyText(track.title || "未知歌曲"),
    artist: qdyText(track.artist || "未知歌手"),
    album: qdyText(track.album),
    cover: qdyText(track.cover),
    duration: Number(track.duration || 0),
    rating: Number(track.rating || 0),
    quality: qdyText(track.quality),
    availableQuality: Array.isArray(track.availableQuality)
      ? track.availableQuality.slice(0, 8)
      : [],
    qqMid: qdyText(track.qqMid),
    qqMediaMid: qdyText(track.qqMediaMid),
    kugouHash: qdyText(track.kugouHash),
    kugou320Hash: qdyText(track.kugou320Hash),
    kugouSqHash: qdyText(track.kugouSqHash),
    copyrightId: qdyText(track.copyrightId),
    lyricUrl: qdyText(track.lyricUrl),
    externalUrl: qdyText(track.externalUrl),
    year: qdyText(track.year),
    language: qdyText(track.language),
    savedAt: Number(track.savedAt || Date.now())
  };
}

function qdyFavoriteIdentity(track) {
  var source = qdySource(track && track.source, "");
  var platformId = qdyFirstText(
    track && track.id,
    track && track.qqMid,
    track && track.kugouHash,
    track && track.kugouSqHash,
    track && track.copyrightId
  );
  if (source && platformId) return source + "|" + platformId;
  return [
    qdyNormalizeSong(track && track.title),
    qdyNormalizeSong(track && track.artist),
    qdyNormalizeSong(track && track.album)
  ].join("|");
}

function qdyLoadFavorites() {
  var records = qdyFavoriteMemory;
  if (qdyFavoriteStorageAvailable()) {
    try {
      var raw = Widget.storage.get(QDY_FAVORITES_KEY);
      var parsed = typeof raw === "string" ? JSON.parse(raw || "[]") : raw;
      if (Array.isArray(parsed)) records = parsed;
    } catch (error) {
      console.log(
        "[forward.quandouya] 收藏读取失败:",
        qdySafeError(error)
      );
    }
  }
  var seen = {};
  return records
    .filter(function (record) {
      return record && typeof record === "object";
    })
    .map(qdyFavoriteRecord)
    .filter(function (record) {
      var identity = qdyFavoriteIdentity(record);
      if (!identity || seen[identity]) return false;
      seen[identity] = true;
      return true;
    })
    .slice(0, QDY_FAVORITES_MAX);
}

function qdySaveFavorites(records) {
  var seen = {};
  var normalized = (Array.isArray(records) ? records : [])
    .map(qdyFavoriteRecord)
    .filter(function (record) {
      var identity = qdyFavoriteIdentity(record);
      if (!identity || seen[identity]) return false;
      seen[identity] = true;
      return true;
    })
    .slice(0, QDY_FAVORITES_MAX);
  qdyFavoriteMemory = normalized;
  if (qdyFavoriteStorageAvailable()) {
    Widget.storage.set(QDY_FAVORITES_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

function qdyFavoriteAdd(track) {
  var incoming = qdyFavoriteRecord(track);
  var identity = qdyFavoriteIdentity(incoming);
  if (!identity || (!incoming.title && !incoming.id)) {
    throw new Error("歌曲信息不完整，无法收藏");
  }
  incoming.savedAt = Date.now();
  var favorites = qdyLoadFavorites().filter(function (record) {
    return qdyFavoriteIdentity(record) !== identity;
  });
  favorites.unshift(incoming);
  return qdySaveFavorites(favorites);
}

function qdyFavoriteSelectorIdentity(selector) {
  var value = qdyText(selector);
  if (value.indexOf("quandouya:") === 0) {
    return qdyFavoriteIdentity(qdyTrackFromParams({ link: value }));
  }
  return "";
}

function qdyFavoriteMatchesSelector(record, selector) {
  var value = qdyText(selector);
  if (!value) return false;
  var identity = qdyFavoriteSelectorIdentity(value);
  if (identity) return qdyFavoriteIdentity(record) === identity;
  var normalized = qdyNormalizeSong(value);
  if (!normalized) return false;
  var searchable = qdyNormalizeSong(
    [record.title, record.artist, record.album].filter(Boolean).join(" ")
  );
  return (
    searchable.indexOf(normalized) >= 0 ||
    normalized.indexOf(qdyNormalizeSong(record.title)) >= 0
  );
}

function qdyFavoriteRemove(selector) {
  var favorites = qdyLoadFavorites();
  var removeIndex = -1;
  for (var index = 0; index < favorites.length; index += 1) {
    if (qdyFavoriteMatchesSelector(favorites[index], selector)) {
      removeIndex = index;
      break;
    }
  }
  if (removeIndex < 0) throw new Error("收藏中没有找到匹配歌曲");
  favorites.splice(removeIndex, 1);
  return qdySaveFavorites(favorites);
}

function qdyFavoriteMoveTop(selector) {
  var favorites = qdyLoadFavorites();
  var matchIndex = -1;
  for (var index = 0; index < favorites.length; index += 1) {
    if (qdyFavoriteMatchesSelector(favorites[index], selector)) {
      matchIndex = index;
      break;
    }
  }
  if (matchIndex < 0) throw new Error("收藏中没有找到匹配歌曲");
  var record = favorites.splice(matchIndex, 1)[0];
  record.savedAt = Date.now();
  favorites.unshift(record);
  return qdySaveFavorites(favorites);
}

function qdyFavoriteSearchScore(track, keyword) {
  var query = qdyNormalizeSong(keyword);
  var title = qdyNormalizeSong(track && track.title);
  var artist = qdyNormalizeSong(track && track.artist);
  if (!query || !title) return -1;
  var combined = qdyNormalizeSong(
    [track.title, track.artist].filter(Boolean).join(" ")
  );
  var score = 0;
  if (title === query) score += 80;
  else if (query.indexOf(title) >= 0) score += 55;
  else if (title.indexOf(query) >= 0) score += 35;
  if (combined === query) score += 45;
  if (artist && query.indexOf(artist) >= 0) score += 25;
  if (!score) return -1;
  score -= Math.min(20, Math.abs(title.length - query.length) / 4);
  return score;
}

function qdyFavoriteBestSearchMatch(tracks, keyword) {
  var best = null;
  var bestScore = -1;
  (tracks || []).forEach(function (track) {
    var score = qdyFavoriteSearchScore(track, keyword);
    if (score > bestScore) {
      best = track;
      bestScore = score;
    }
  });
  return bestScore >= 20 ? best : null;
}

async function qdyFavoriteFromKeyword(keyword, source) {
  var value = qdyText(keyword);
  if (!value) throw new Error("请输入歌名、歌手或歌曲链接");
  if (value.indexOf("quandouya:") === 0) {
    var direct = qdyTrackFromParams({ link: value });
    if (!direct.source || !direct.title) {
      throw new Error("歌曲链接无法识别");
    }
    return direct;
  }
  var results = await searchQdy({
    keyword: value,
    source: qdySource(source, "all") || "all",
    result_limit: "20"
  });
  var items = results.map(function (item) {
    return qdyTrackFromParams({ link: item.link });
  });
  var matched = qdyFavoriteBestSearchMatch(items, value);
  if (!matched) throw new Error("没有找到足够匹配的歌曲，请补充歌手名");
  return matched;
}

function qdyFavoritePublicItems(records, limit, offset) {
  var maximum = Math.max(1, Number(limit || qdyRuntime.limit || 30));
  var start = Math.max(0, Number(offset || 0));
  return (records || []).slice(0, maximum).map(function (record, index) {
    var item = qdyPublicTrack(
      record,
      "我的收藏",
      "favorites",
      start + index + 1
    );
    item.description = [
      record.artist || "未知歌手",
      qdySourceName(record.source),
      "已收藏"
    ]
      .filter(Boolean)
      .join(" · ");
    return item;
  });
}

function qdyFavoriteHelpItem(title, description) {
  var link = "quandouya:favorites-help?mode=empty";
  return {
    id: link,
    type: "url",
    title: title,
    originalTitle: title,
    description: description,
    posterPath: QDY_ICON,
    detailPoster: QDY_ICON,
    backdropPath: QDY_ICON,
    backdropPaths: [QDY_ICON],
    coverUrl: QDY_ICON,
    rating: 0,
    mediaType: "movie",
    genreTitle: "我的收藏",
    genreItems: [],
    peoples: [],
    link: link,
    externalUrl: link,
    source: "全豆要音源"
  };
}

function qdyFavoriteIsSaved(track) {
  var identity = qdyFavoriteIdentity(track);
  return qdyLoadFavorites().some(function (record) {
    return qdyFavoriteIdentity(record) === identity;
  });
}

function qdyFavoriteActionLink(action, track) {
  return (
    "quandouya:favorite-action?" +
    qdyQuery({
      action: action,
      track: qdyTrackLink(track)
    })
  );
}

function qdyFavoriteActionItem(action, track) {
  var title =
    action === "remove"
      ? "取消收藏"
      : action === "top"
        ? "移到收藏最前"
        : "收藏这首歌";
  var description =
    action === "remove"
      ? "从我的收藏中移除当前歌曲"
      : action === "top"
        ? "把当前歌曲移动到收藏列表最前"
        : "把当前歌曲加入我的收藏";
  var link = qdyFavoriteActionLink(action, track);
  return {
    id: link,
    type: "url",
    title: title,
    originalTitle: title,
    description: description,
    posterPath: QDY_ICON,
    detailPoster: QDY_ICON,
    backdropPath: QDY_ICON,
    backdropPaths: [QDY_ICON],
    coverUrl: QDY_ICON,
    rating: 0,
    mediaType: "movie",
    genreTitle: "收藏操作",
    genreItems: [],
    peoples: [],
    link: link,
    externalUrl: link,
    source: "全豆要音源"
  };
}

function qdyFavoriteActionItems(track) {
  if (!track || (!track.source && !track.title)) return [];
  if (!qdyFavoriteIsSaved(track)) {
    return [qdyFavoriteActionItem("add", track)];
  }
  return [
    qdyFavoriteActionItem("remove", track),
    qdyFavoriteActionItem("top", track)
  ];
}

function qdyFavoriteActionResult(action, track) {
  var title =
    action === "remove"
      ? "已取消收藏"
      : action === "top"
        ? "已移到收藏最前"
        : "已收藏";
  var item = qdyPublicTrack(track, "收藏操作");
  item.title = title + " · " + qdyFirstText(track.title, "歌曲");
  item.originalTitle = title;
  item.description =
    title +
    "\n" +
    [track.title, track.artist].filter(Boolean).join(" - ");
  item.link = qdyTrackLink(track);
  item.id = item.link;
  item.externalUrl = item.link;
  item.relatedItems = qdyFavoriteActionItems(track);
  return item;
}

async function qdyHandleFavoriteAction(raw) {
  var parsed = qdyParseLink(raw);
  var track = qdyTrackFromParams({
    link: qdyText(parsed.track)
  });
  if (!track.source || !track.title) {
    throw new Error("收藏操作缺少有效歌曲信息");
  }
  var action =
    parsed.action === "remove"
      ? "remove"
      : parsed.action === "top"
        ? "top"
        : "add";
  if (action === "remove") {
    qdyFavoriteRemove(qdyTrackLink(track));
  } else if (action === "top") {
    qdyFavoriteMoveTop(qdyTrackLink(track));
  } else {
    qdyFavoriteAdd(track);
  }
  return qdyFavoriteActionResult(action, track);
}

async function favoriteList(params) {
  try {
    params = qdyApplySettings(params || {});
    var page = qdyPage(params.page);
    var limit = qdyLimit(params);
    var records = qdyLoadFavorites();
    var start = (page - 1) * limit;
    if (!records.length && page === 1) {
      return [
        qdyFavoriteHelpItem(
          "暂无收藏",
          "打开“收藏管理”，输入歌名和歌手即可添加"
        )
      ];
    }
    return qdyFavoritePublicItems(
      records.slice(start, start + limit),
      limit,
      start
    );
  } catch (error) {
    console.error("[favoriteList] 失败:", qdySafeError(error));
    throw error;
  }
}

async function favoriteManager(params) {
  try {
    params = qdyApplySettings(params || {});
    var operation =
      String(params.operation || "add").toLowerCase() === "remove"
        ? "remove"
        : String(params.operation || "add").toLowerCase() === "top"
          ? "top"
          : "add";
    var keyword = qdySearchText(params);
    if (keyword) {
      if (operation === "remove") {
        qdyFavoriteRemove(keyword);
      } else if (operation === "top") {
        qdyFavoriteMoveTop(keyword);
      } else {
        var track = await qdyFavoriteFromKeyword(
          keyword,
          params.source
        );
        qdyFavoriteAdd(track);
      }
    }
    var page = qdyPage(params.page);
    var limit = qdyLimit(params);
    var records = qdyLoadFavorites();
    var start = (page - 1) * limit;
    if (!records.length && page === 1) {
      return [
        qdyFavoriteHelpItem(
          "输入歌名添加收藏",
          "选择操作，填写歌名和歌手；也可粘贴全豆要歌曲链接"
        )
      ];
    }
    return qdyFavoritePublicItems(
      records.slice(start, start + limit),
      limit,
      start
    );
  } catch (error) {
    console.error("[favoriteManager] 失败:", qdySafeError(error));
    throw error;
  }
}

function qdyValidateAudioURL(url) {
  var value = qdyText(url);
  if (!/^https?:\/\//i.test(value)) {
    throw new Error("线路没有返回有效的 HTTP 音频地址");
  }
  return value;
}

async function qdyResolveNetease(track, quality) {
  if (!track.id) throw new Error("网易云歌曲缺少 ID");
  var br = quality === "128k" ? "128" : quality === "flac" || quality === "24bit" ? "740" : "320";
  if (quality === "24bit") br = "999";
  var url =
    QDY_NETEASE_API +
    "&" +
    qdyQuery({
      types: "url",
      source: "netease",
      id: track.id,
      br: br
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://music.gdstudio.xyz/"
  });
  if (!data || !data.url) {
    throw new Error((data && (data.message || data.detail)) || "网易云未返回音频地址");
  }
  var extension = qdyFormatFromURL(data.url);
  var bitrate = Number(data.br || 0);
  var resolvedQuality =
    extension === "FLAC"
      ? "无损 FLAC"
      : extension
        ? (bitrate ? bitrate + "K " : "") + extension
        : bitrate >= 740
          ? "无损 FLAC"
          : bitrate
            ? bitrate + "K MP3"
            : qdyQualityLabel(quality);
  return {
    url: qdyValidateAudioURL(data.url),
    provider: "网易云音乐",
    source: "netease",
    line: "星海主线路",
    quality: resolvedQuality
  };
}

function qdyQQFileCandidates(track, quality) {
  var mediaMid = qdyText(track.qqMediaMid || track.qqMid);
  if (!mediaMid) return [];
  var files = [];
  if (quality === "flac" || quality === "24bit") {
    files.push("F000" + mediaMid + ".flac");
  }
  if (quality === "320k" || quality === "flac" || quality === "24bit") {
    files.push("M800" + mediaMid + ".mp3");
  }
  files.push("M500" + mediaMid + ".mp3");
  files.push("C400" + mediaMid + ".m4a");
  return files.filter(function (file, index, list) {
    return list.indexOf(file) === index;
  });
}

async function qdyQQURLForFile(mid, filename) {
  var payload = {
    req_0: {
      module: "vkey.GetVkeyServer",
      method: "CgiGetVkey",
      param: {
        guid: "10000",
        songmid: [mid],
        filename: [filename],
        songtype: [0],
        uin: "0",
        loginflag: 1,
        platform: "20"
      }
    },
    comm: {
      uin: 0,
      format: "json",
      ct: 24,
      cv: 0
    }
  };
  var url =
    QDY_QQ_VKEY +
    "?" +
    qdyQuery({
      format: "json",
      data: JSON.stringify(payload)
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://y.qq.com/"
  });
  var info =
    data.req_0 &&
    data.req_0.data &&
    data.req_0.data.midurlinfo &&
    data.req_0.data.midurlinfo[0];
  if (!info || !info.purl) return "";
  var servers =
    (data.req_0.data && data.req_0.data.sip) || [
      "https://aqqmusic.tc.qq.com/"
    ];
  var base =
    servers.find(function (server) {
      return /^https:\/\//i.test(server);
    }) || qdyHttps(servers[0] || "https://aqqmusic.tc.qq.com/");
  return base.replace(/\/+$/, "") + "/" + info.purl.replace(/^\/+/, "");
}

async function qdyResolveQQ(track, quality) {
  var mid = qdyText(track.qqMid || track.id);
  if (!mid) throw new Error("QQ 音乐歌曲缺少 songmid");
  var files = qdyQQFileCandidates(track, quality);
  var lastError = null;
  for (var index = 0; index < files.length; index += 1) {
    try {
      var url = await qdyQQURLForFile(mid, files[index]);
      if (url) {
        var fileQuality =
          /^F000/i.test(files[index])
            ? "无损 FLAC"
            : /^M800/i.test(files[index])
              ? "320K MP3"
              : /^M500/i.test(files[index])
                ? "128K MP3"
                : qdyFormatFromURL(url) || qdyQualityLabel(quality);
        return {
          url: qdyValidateAudioURL(url),
          provider: "QQ 音乐",
          source: "qq",
          line: "QQ 音乐直链",
          quality: fileQuality
        };
      }
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    "QQ 音乐未返回可播放地址" +
      (lastError ? "（" + qdySafeError(lastError) + "）" : "，歌曲可能受会员版权限制")
  );
}

function qdyKuwoLevel(quality) {
  if (quality === "128k") return "standard";
  if (quality === "320k") return "exhigh";
  return "lossless";
}

async function qdyResolveKuwo(track, quality) {
  var id = qdyKuwoID(track.id);
  if (!id) {
    var candidates = await qdySearchKuwo(
      [track.title, track.artist].filter(Boolean).join(" "),
      1,
      8
    );
    var matched = candidates.find(function (item) {
      return qdySongMatch(item.title, track.title);
    });
    if (!matched) throw new Error("酷我没有找到匹配歌曲");
    id = qdyKuwoID(matched.id);
  }
  if (!id) throw new Error("酷我歌曲缺少 rid");
  var url =
    QDY_KUWO_PLAY +
    "&" +
    qdyQuery({
      id: id,
      level: qdyKuwoLevel(quality)
    });
  return {
    url: qdyValidateAudioURL(url),
    provider: "酷我音乐",
    source: "kuwo",
    line: "长青 SVIP 线路",
    quality: qdyQualityLabel(quality)
  };
}

function qdyKugouHash(track, quality) {
  if ((quality === "flac" || quality === "24bit") && track.kugouSqHash) {
    return track.kugouSqHash;
  }
  if ((quality === "320k" || quality === "flac" || quality === "24bit") && track.kugou320Hash) {
    return track.kugou320Hash;
  }
  return qdyText(track.kugouHash || track.id);
}

async function qdyResolveKugou(track, quality) {
  var hash = qdyKugouHash(track, quality);
  if (!hash) throw new Error("酷狗歌曲缺少 hash");
  var url =
    QDY_KUGOU_PLAY +
    "?" +
    qdyQuery({
      cmd: "playInfo",
      hash: hash
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://www.kugou.com/"
  });
  if (!data.url) {
    throw new Error(data.error || "酷狗未返回音频地址，歌曲可能受会员版权限制");
  }
  return {
    url: qdyValidateAudioURL(data.url),
    provider: "酷狗音乐",
    source: "kugou",
    line: "酷狗移动线路",
    quality: qdyFormatFromURL(data.url) || qdyQualityLabel(quality)
  };
}

function qdyFirstURL(value, depth) {
  if (depth > 5 || value === null || value === undefined) return "";
  if (typeof value === "string") {
    return /^https?:\/\//i.test(value) ? value : "";
  }
  if (Array.isArray(value)) {
    for (var index = 0; index < value.length; index += 1) {
      var arrayURL = qdyFirstURL(value[index], depth + 1);
      if (arrayURL) return arrayURL;
    }
    return "";
  }
  if (typeof value === "object") {
    var keys = [
      "url",
      "playUrl",
      "listenUrl",
      "auditionUrl",
      "audioUrl",
      "src"
    ];
    for (var keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      var direct = qdyFirstURL(value[keys[keyIndex]], depth + 1);
      if (direct) return direct;
    }
    var objectKeys = Object.keys(value);
    for (var objectIndex = 0; objectIndex < objectKeys.length; objectIndex += 1) {
      var nested = qdyFirstURL(value[objectKeys[objectIndex]], depth + 1);
      if (nested) return nested;
    }
  }
  return "";
}

async function qdyResolveMigu(track, quality) {
  if (!track.id) throw new Error("咪咕歌曲缺少 contentId");
  var toneFlag =
    quality === "flac" || quality === "24bit"
      ? "SQ"
      : quality === "320k"
        ? "HQ"
        : "PQ";
  var url =
    QDY_MIGU_PLAY +
    "?" +
    qdyQuery({
      toneFlag: toneFlag,
      netType: "00",
      userId: "1554861458870011",
      ua: "Android_migu",
      version: "5.0.1",
      copyrightId: track.copyrightId,
      contentId: track.id,
      resourceType: 2,
      channel: "0146921"
    });
  var raw = await qdyRequest("GET", url, null, {
    Referer: "https://music.migu.cn/"
  });
  var data = qdyParseJSON(raw);
  var audioURL = qdyFirstURL(data, 0);
  if (!audioURL) {
    throw new Error(
      data.info ||
        data.message ||
        "咪咕暂不提供试听地址，歌曲可能受版权限制"
    );
  }
  return {
    url: qdyValidateAudioURL(audioURL),
    provider: "咪咕音乐",
    source: "migu",
    line: "咪咕试听线路",
    quality: qdyFormatFromURL(audioURL) || qdyQualityLabel(quality)
  };
}

async function qdyResolveQishui(track, quality) {
  if (!track.id) throw new Error("汽水歌曲缺少 ID");
  var url =
    QDY_QISHUI_API +
    "?" +
    qdyQuery({
      act: "song",
      id: track.id,
      quality: qdyQishuiQuality(quality)
    });
  var data = await qdyGetJSON(url);
  var item =
    (Array.isArray(data.data) && data.data[0]) ||
    (data.data && data.data.data) ||
    data.data ||
    {};
  if (!item.url) {
    throw new Error("汽水接口未返回音频地址");
  }
  var audioURL = item.url;
  if (item.ekey) {
    var proxy = await qdyPostJSON(QDY_QISHUI_PROXY, {
      url: item.url,
      key: item.ekey,
      filename: item.filename || "KMusic",
      ext: item.fileExtension || "aac"
    });
    if (Number(proxy.code) !== 200 || !proxy.url) {
      throw new Error("汽水代理解密失败");
    }
    audioURL = proxy.url;
  }
  return {
    url: qdyValidateAudioURL(audioURL),
    provider: "汽水音乐",
    source: "qishui",
    line: "汽水 VIP 线路",
    quality: qdyFormatFromURL(audioURL) || qdyQualityLabel(quality)
  };
}

function qdyLyricCacheKey(track) {
  return [
    qdyText(track.source),
    qdyText(track.id),
    qdyNormalizeSong(track.title),
    qdyNormalizeSong(track.artist)
  ].join("|");
}

function qdyLRCTime(seconds) {
  var value = Math.max(0, Number(seconds || 0));
  var minutes = Math.floor(value / 60);
  var remain = value - minutes * 60;
  return (
    String(minutes).padStart(2, "0") +
    ":" +
    remain.toFixed(3).padStart(6, "0")
  );
}

function qdyLRCFromLines(lines) {
  if (!Array.isArray(lines) || !lines.length) return "";
  return (
    lines
      .map(function (line) {
        var text = qdyText(line && line.text)
          .replace(/\r?\n/g, " / ")
          .replace(/\s+/g, " ");
        return text ? "[" + qdyLRCTime(line.start) + "]" + text : "";
      })
      .filter(Boolean)
      .join("\n") + "\n"
  );
}

function qdyParseLRC(value) {
  var raw = qdyText(value)
    .replace(/\r/g, "")
    .replace(/\uFEFF/g, "");
  if (!raw) return [];

  var offset = 0;
  var offsetMatch = raw.match(/\[offset\s*:\s*(-?\d+)\]/i);
  if (offsetMatch) offset = Number(offsetMatch[1]) / 1000;

  var grouped = {};
  raw.split("\n").forEach(function (line) {
    if (!line || /^\s*\[(ti|ar|al|by|re|ve|offset|length|kana|language)\s*:/i.test(line)) {
      return;
    }
    var timestamps = [];
    var stampPattern = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    var stamp;
    while ((stamp = stampPattern.exec(line))) {
      var fraction = Number(
        ("0." + String(stamp[3] || "0").padEnd(3, "0").slice(0, 3))
      );
      timestamps.push(
        Number(stamp[1]) * 60 +
          Number(stamp[2]) +
          (isFinite(fraction) ? fraction : 0)
      );
    }
    if (!timestamps.length) return;

    var text = qdyStripTags(
      line.replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ")
    );
    if (!text) return;
    timestamps.forEach(function (time) {
      var adjusted = Math.max(0, time + offset);
      var key = adjusted.toFixed(3);
      if (!grouped[key]) grouped[key] = [];
      if (grouped[key].indexOf(text) < 0) grouped[key].push(text);
    });
  });

  return Object.keys(grouped)
    .map(function (key) {
      return {
        start: Number(key),
        text: grouped[key].join("\n")
      };
    })
    .filter(function (line) {
      return line.text && line.start >= 0;
    })
    .sort(function (left, right) {
      return left.start - right.start;
    })
    .slice(0, 800);
}

function qdyKuwoLRC(data) {
  var rows =
    (data && data.data && data.data.lrclist) ||
    (data && data.lrclist) ||
    [];
  return rows
    .map(function (row) {
      var time = Number(row.time || row.timeStart || 0);
      var lyric = qdyText(row.lineLyric || row.lyric || row.text);
      return lyric ? "[" + qdyLRCTime(time) + "]" + lyric : "";
    })
    .filter(Boolean)
    .join("\n");
}

async function qdyLRCLibLyric(track) {
  if (!track || !track.title) return "";
  var url =
    QDY_LRCLIB_API +
    "?" +
    qdyQuery({
      track_name: track.title,
      artist_name: track.artist,
      album_name: track.album,
      duration: track.duration ? Math.round(Number(track.duration)) : ""
    });
  var data = await qdyGetJSON(url, {
    Accept: "application/json"
  });
  var rows = Array.isArray(data) ? data : [];
  var candidates = rows.map(function (row) {
    return {
      title: qdyText(row && row.trackName),
      artist: qdyText(row && row.artistName),
      album: qdyText(row && row.albumName),
      duration: Number(row && row.duration),
      syncedLyrics: qdyText(row && row.syncedLyrics)
    };
  });
  var matched = qdyBestLyricCandidate(candidates, track);
  return matched ? matched.syncedLyrics : "";
}

function qdyTextFromNeteaseLyric(data) {
  return qdyText(
    (data && data.lrc && data.lrc.lyric) ||
      (data && data.lyric) ||
      ""
  );
}

async function qdyNeteaseLyric(id) {
  if (!id) return "";
  var url =
    QDY_NETEASE_WEB +
    "/song/lyric?" +
    qdyQuery({
      id: id,
      lv: -1,
      kv: -1,
      tv: -1
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://music.163.com/"
  });
  return qdyTextFromNeteaseLyric(data);
}

async function qdyQQLyric(songmid) {
  if (!songmid) return "";
  var url =
    "https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?" +
    qdyQuery({
      songmid: songmid,
      format: "json",
      nobase64: 1,
      g_tk: 5381
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://y.qq.com/"
  });
  return qdyText(data.lyric || (data.data && data.data.lyric));
}

async function qdyKuwoLyric(id) {
  var musicId = qdyKuwoID(id);
  if (!musicId) return "";
  var url =
    "https://m.kuwo.cn/newh5/singles/songinfoandlrc?" +
    qdyQuery({ musicId: musicId });
  var data = await qdyGetJSON(url, {
    Referer: "https://www.kuwo.cn/"
  });
  return qdyKuwoLRC(data);
}

async function qdyMiguLyric(url) {
  if (!/^https?:\/\//i.test(qdyText(url))) return "";
  return qdyText(
    await qdyRequest("GET", qdyText(url), null, {
      Referer: "https://music.migu.cn/"
    })
  );
}

async function qdyQishuiLyric(id) {
  if (!id) return "";
  var url =
    QDY_QISHUI_API +
    "?" +
    qdyQuery({
      act: "lyric",
      id: id
    });
  var data = await qdyGetJSON(url);
  return qdyText(
    data.lyric ||
      (data.data && (data.data.lyric || data.data.lrc)) ||
      ""
  );
}

function qdyLyricCandidateScore(candidate, track) {
  if (!candidate || !candidate.title || !track.title) return -1;
  var titleA = qdyNormalizeSong(candidate.title);
  var titleB = qdyNormalizeSong(track.title);
  if (!titleA || !titleB) return -1;
  if (titleA !== titleB && titleA.indexOf(titleB) < 0 && titleB.indexOf(titleA) < 0) {
    return -1;
  }
  var score = titleA === titleB ? 12 : 7;
  var artistA = qdyNormalizeSong(candidate.artist);
  var artistB = qdyNormalizeSong(track.artist);
  if (artistA && artistB) {
    if (artistA === artistB) score += 6;
    else if (artistA.indexOf(artistB) >= 0 || artistB.indexOf(artistA) >= 0) score += 4;
    else score -= 3;
  }
  var albumA = qdyNormalizeSong(candidate.album);
  var albumB = qdyNormalizeSong(track.album);
  if (albumA && albumB && (albumA === albumB || albumA.indexOf(albumB) >= 0 || albumB.indexOf(albumA) >= 0)) {
    score += 2;
  }
  if (track.duration && candidate.duration) {
    var difference = Math.abs(Number(track.duration) - Number(candidate.duration));
    if (difference <= 3) score += 3;
    else if (difference <= 8) score += 1;
    else if (difference > 20) score -= 2;
  }
  return score;
}

function qdyBestLyricCandidate(candidates, track) {
  var best = null;
  var bestScore = -1;
  (candidates || []).forEach(function (candidate) {
    var score = qdyLyricCandidateScore(candidate, track);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });
  return bestScore >= 4 ? best : null;
}

async function qdyDirectLyric(track) {
  if (track.source === "netease" && track.id) {
    return {
      text: await qdyNeteaseLyric(track.id),
      provider: "网易云音乐"
    };
  }
  if (track.source === "qq" && (track.qqMid || track.id)) {
    return {
      text: await qdyQQLyric(track.qqMid || track.id),
      provider: "QQ 音乐"
    };
  }
  if (track.source === "kuwo" && track.id) {
    return {
      text: await qdyKuwoLyric(track.id),
      provider: "酷我音乐"
    };
  }
  if (track.source === "migu" && track.lyricUrl) {
    return {
      text: await qdyMiguLyric(track.lyricUrl),
      provider: "咪咕音乐"
    };
  }
  if (track.source === "qishui" && track.id) {
    return {
      text: await qdyQishuiLyric(track.id),
      provider: "汽水音乐"
    };
  }
  return { text: "", provider: "" };
}

async function qdyNeteaseLyricFallback(track) {
  if (!track.title) return "";
  var keyword = [track.title, track.artist].filter(Boolean).join(" ");
  var songs = await qdySearchNetease(keyword, 1, 12);
  var matched = qdyBestLyricCandidate(songs, track);
  return matched ? qdyNeteaseLyric(matched.id) : "";
}

async function qdyQQLyricFallback(track) {
  if (!track.title) return "";
  var keyword = [track.title, track.artist].filter(Boolean).join(" ");
  var songs = await qdySearchQQ(keyword, 1, 12);
  var matched = qdyBestLyricCandidate(songs, track);
  return matched ? qdyQQLyric(matched.qqMid || matched.id) : "";
}

async function qdyKuwoLyricFallback(track) {
  if (!track.title) return "";
  var keyword = [track.title, track.artist].filter(Boolean).join(" ");
  var songs = await qdySearchKuwo(keyword, 1, 12);
  var matched = qdyBestLyricCandidate(songs, track);
  return matched ? qdyKuwoLyric(matched.id) : "";
}

async function qdyFetchLyric(track) {
  var key = qdyLyricCacheKey(track);
  if (qdyLyricCache[key]) return qdyLyricCache[key];

  var attempts = [
    function () {
      return qdyDirectLyric(track);
    },
    function () {
      return qdyLRCLibLyric(track).then(function (text) {
        return { text: text, provider: "LRCLIB 匹配歌词" };
      });
    },
    function () {
      return qdyNeteaseLyricFallback(track).then(function (text) {
        return { text: text, provider: "网易云匹配歌词" };
      });
    },
    function () {
      return qdyQQLyricFallback(track).then(function (text) {
        return { text: text, provider: "QQ 音乐匹配歌词" };
      });
    },
    function () {
      return qdyKuwoLyricFallback(track).then(function (text) {
        return { text: text, provider: "酷我匹配歌词" };
      });
    }
  ];

  var errors = [];
  for (var index = 0; index < attempts.length; index += 1) {
    try {
      var result = await attempts[index]();
      var lines = qdyParseLRC(result && result.text);
      if (lines.length >= 2) {
        var lrc = qdyLRCFromLines(lines);
        var value = {
          lines: lines,
          text: lrc,
          lrc: lrc,
          provider: result.provider
        };
        qdyLyricCache[key] = value;
        return value;
      }
    } catch (error) {
      errors.push(qdySafeError(error));
    }
  }
  if (errors.length) {
    console.log("[forward.quandouya] 歌词读取失败:", errors.join("; "));
  }
  return null;
}

function qdySubtitleServiceURL() {
  var value = qdyText(qdyRuntime.subtitleService).replace(/\/+$/, "");
  return /^https?:\/\/[^/\s]+/i.test(value) ? value : "";
}

function qdySubtitleResponseURL(response, providerLabel) {
  var status = qdyResponseStatus(response);
  if (status && (status < 200 || status >= 300)) {
    throw new Error(providerLabel + " HTTP " + status);
  }
  var body = qdyResponseData(response);
  var parsed = body;
  if (typeof body === "string") {
    try {
      parsed = qdyParseJSON(body);
    } catch (error) {
      parsed = body;
    }
  }
  var hosted =
    parsed && typeof parsed === "object"
      ? qdyFirstText(parsed.url, parsed.fileUrl, parsed.sourceUrl)
      : qdyText(parsed);
  hosted = qdyText(hosted).split(/\s+/)[0];
  if (!/^https?:\/\/\S+$/i.test(hosted)) {
    throw new Error(providerLabel + " 未返回 HTTP(S) 地址");
  }
  return hosted;
}

function qdySubtitleContentType(format) {
  if (format === "ass") return "text/x-ssa; charset=utf-8";
  if (format === "vtt") return "text/vtt; charset=utf-8";
  return "text/plain; charset=utf-8";
}

async function qdyValidateSubtitleURL(url, format) {
  var response = await Widget.http.get(url, {
    headers: {
      Accept: "text/plain,*/*",
      "User-Agent": QDY_USER_AGENT
    },
    timeout: QDY_SUBTITLE_TIMEOUT
  });
  var status = qdyResponseStatus(response);
  if (status && (status < 200 || status >= 300)) {
    throw new Error("字幕回读 HTTP " + status);
  }
  var data = qdyResponseData(response);
  var content = typeof data === "string" ? data : JSON.stringify(data || "");
  if (
    !content ||
    (format === "ass" && content.indexOf("[Script Info]") < 0) ||
    (format === "vtt" && content.indexOf("WEBVTT") < 0) ||
    (format === "lrc" && qdyParseLRC(content).length < 2)
  ) {
    throw new Error("字幕回读内容无效");
  }
  return url;
}

function qdyLrcHostURL() {
  var value = qdyText(qdyRuntime.lrcHost);
  return /^https?:\/\/\S+$/i.test(value) ? value : "";
}

async function qdyPrimarySubtitleText(subtitleText) {
  var serviceURL = qdyLrcHostURL();
  if (!serviceURL) throw new Error("未配置 LRC 主托管接口");
  var response = await Widget.http.post(serviceURL, subtitleText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Accept: "application/json",
      "User-Agent": QDY_USER_AGENT
    },
    timeout: QDY_SUBTITLE_TIMEOUT
  });
  return qdyValidateSubtitleURL(
    qdySubtitleResponseURL(response, "自定义 LRC 主托管"),
    "lrc"
  );
}

async function qdyPastesSubtitleText(subtitleText, format) {
  var response = await Widget.http.post(QDY_PASTES_SUBTITLE, subtitleText, {
    headers: {
      "Content-Type": qdySubtitleContentType(format),
      Accept: "application/json,text/plain,*/*",
      "User-Agent": QDY_USER_AGENT
    },
    timeout: QDY_SUBTITLE_TIMEOUT
  });
  var status = qdyResponseStatus(response);
  if (status && (status < 200 || status >= 300)) {
    throw new Error("pastes.dev HTTP " + status);
  }
  var body = qdyResponseData(response);
  var parsed = body;
  if (typeof body === "string") {
    try {
      parsed = qdyParseJSON(body);
    } catch (error) {
      parsed = body;
    }
  }
  var value =
    parsed && typeof parsed === "object"
      ? qdyFirstText(parsed.url, parsed.key, parsed.id)
      : qdyText(parsed);
  if (/^https?:\/\//i.test(value)) {
    return qdyValidateSubtitleURL(value, format);
  }
  var key = qdyText(value).replace(/^\/+/, "");
  if (!/^[A-Za-z0-9_-]{4,128}$/.test(key)) {
    throw new Error("pastes.dev 未返回有效歌词 Key");
  }
  return qdyValidateSubtitleURL(
    "https://api.pastes.dev/" + encodeURIComponent(key),
    format
  );
}

async function qdyCnetSubtitleText(subtitleText, format) {
  var response = await Widget.http.post(QDY_CNET_SUBTITLE, subtitleText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Accept: "text/plain,application/json,*/*",
      "User-Agent": QDY_USER_AGENT
    },
    timeout: QDY_SUBTITLE_TIMEOUT
  });
  return qdyValidateSubtitleURL(
    qdySubtitleResponseURL(response, "paste.c-net.org"),
    format
  );
}

function qdyUguuMultipartBody(subtitleText, format, boundary) {
  var fileName =
    format === "ass"
      ? "quandouya-lyrics.ass"
      : format === "vtt"
        ? "quandouya-lyrics.vtt"
        : "quandouya-lyrics.lrc";
  return (
    "--" +
    boundary +
    "\r\n" +
    'Content-Disposition: form-data; name="files[]"; filename="' +
    fileName +
    '"\r\n' +
    "Content-Type: " +
    qdySubtitleContentType(format) +
    "\r\n\r\n" +
    subtitleText +
    "\r\n--" +
    boundary +
    "--\r\n"
  );
}

async function qdyUguuSubtitleText(subtitleText, format) {
  var boundary = "----QuandouyaSubtitleBoundary20261116";
  var body = qdyUguuMultipartBody(subtitleText, format, boundary);
  var response = await Widget.http.post(QDY_UGUU_SUBTITLE, body, {
    headers: {
      "Content-Type": "multipart/form-data; boundary=" + boundary,
      Accept: "text/plain,application/json,*/*",
      "User-Agent": QDY_USER_AGENT
    },
    timeout: QDY_SUBTITLE_TIMEOUT
  });
  return qdyValidateSubtitleURL(
    qdySubtitleResponseURL(response, "uguu.se"),
    format
  );
}

async function qdyCustomSubtitleText(subtitleText, format, identifier) {
  var serviceURL = qdySubtitleServiceURL();
  if (!serviceURL) {
    throw new Error("未配置自建歌词字幕服务");
  }
  var headers = {
    "Content-Type": qdySubtitleContentType(format),
    Accept: "application/json,text/plain,*/*",
    "X-Subtitle-ID": encodeURIComponent(identifier),
    "X-Subtitle-Format": format
  };
  if (qdyRuntime.subtitleToken) {
    headers["X-Upload-Token"] = qdyRuntime.subtitleToken;
  }
  var response = await Widget.http.post(serviceURL, subtitleText, {
    headers: headers,
    timeout: QDY_SUBTITLE_TIMEOUT
  });
  return qdyValidateSubtitleURL(
    qdySubtitleResponseURL(response, "自建字幕服务"),
    format
  );
}

function qdyLoadSubtitleProviderBlocks() {
  if (qdySubtitleProviderBlocksLoaded) return;
  qdySubtitleProviderBlocksLoaded = true;
  try {
    var stored = Widget.storage.get("subtitleProviderBlocksV2");
    var parsed = qdyParseJSON(stored);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      qdySubtitleProviderBlockedUntil = parsed;
    }
  } catch (error) {
    qdySubtitleProviderBlockedUntil = {};
  }
}

function qdySubtitleProviderBlocked(provider) {
  qdyLoadSubtitleProviderBlocks();
  return Number(qdySubtitleProviderBlockedUntil[provider] || 0) > Date.now();
}

function qdySubtitleCooldownMs(provider, error) {
  if (
    provider === "自定义 LRC 主托管" ||
    provider === "自建字幕服务"
  ) {
    return 15 * 1000;
  }
  var message = qdySafeError(error);
  if (/HTTP\s+(?:401|403|429)|rate.?limit|too many/i.test(message)) {
    return 60 * 1000;
  }
  if (/未返回|内容无效|格式/.test(message)) {
    return 10 * 1000;
  }
  if (provider === "uguu.se") return 2 * 60 * 1000;
  return 60 * 1000;
}

function qdyBlockSubtitleProvider(provider, error) {
  qdySubtitleProviderBlockedUntil[provider] =
    Date.now() + qdySubtitleCooldownMs(provider, error);
  try {
    Widget.storage.set(
      "subtitleProviderBlocksV2",
      JSON.stringify(qdySubtitleProviderBlockedUntil)
    );
  } catch (error) {}
}

async function qdyHostSubtitleText(identifier, subtitleText, format) {
  var providers = [];
  var primaryURL = qdyLrcHostURL();
  var serviceURL = qdySubtitleServiceURL();
  if (primaryURL) {
    providers.push({
      name: "自定义 LRC 主托管",
      upload: function () {
        return qdyPrimarySubtitleText(subtitleText, format);
      }
    });
  }
  if (serviceURL && serviceURL !== primaryURL) {
    providers.push({
      name: "自建字幕服务",
      upload: function () {
        return qdyCustomSubtitleText(subtitleText, format, identifier);
      }
    });
  }
  providers.push({
    name: "pastes.dev",
    upload: function () {
      return qdyPastesSubtitleText(subtitleText, format);
    }
  });
  providers.push({
    name: "uguu.se",
    upload: function () {
      return qdyUguuSubtitleText(subtitleText, format);
    }
  });

  var errors = [];
  for (var index = 0; index < providers.length; index += 1) {
    var provider = providers[index];
    if (qdySubtitleProviderBlocked(provider.name)) {
      errors.push(provider.name + ": 短时冷却中");
      continue;
    }
    try {
      var url = await provider.upload();
      if (index > 0) {
        console.log(
          "[forward.quandouya] 字幕托管已切换至:",
          provider.name
        );
      }
      return {
        url: url,
        provider: provider.name
      };
    } catch (error) {
      console.log(
        "[forward.quandouya] 字幕托管失败:",
        provider.name,
        qdySafeError(error)
      );
      errors.push(provider.name + ": " + qdySafeError(error));
      qdyBlockSubtitleProvider(provider.name, error);
    }
  }
  throw new Error(errors.join("; "));
}

function qdySubtitleHostTTL(provider) {
  if (provider === "自定义 LRC 主托管") return 7 * 24 * 60 * 60 * 1000;
  if (provider === "pastes.dev") return 6 * 24 * 60 * 60 * 1000;
  if (provider === "uguu.se") return 2.5 * 60 * 60 * 1000;
  if (provider === "paste.c-net.org") return 24 * 60 * 60 * 1000;
  return 60 * 60 * 1000;
}

function qdyCachedSubtitleHost(identifier) {
  var entry = qdySubtitleHostCache[identifier];
  if (!entry) return null;
  if (typeof entry === "string") {
    return { url: entry, provider: "缓存" };
  }
  if (
    !entry.url ||
    (entry.expiresAt && entry.expiresAt <= Date.now() + 5 * 60 * 1000)
  ) {
    delete qdySubtitleHostCache[identifier];
    return null;
  }
  return entry;
}

function qdyCacheSubtitleHost(identifier, hosted) {
  qdySubtitleHostCache[identifier] = {
    url: hosted.url,
    provider: hosted.provider,
    expiresAt: Date.now() + qdySubtitleHostTTL(hosted.provider)
  };
}

async function qdySubtitleTrack(track, lyric) {
  var lyricText = qdyText(lyric && (lyric.lrc || lyric.text));
  if (!lyricText) return null;
  var lines = qdyParseLRC(lyricText);
  if (lines.length < 2) return null;
  var identifier = [
    "quandouya-lyrics",
    "lrc",
    qdyText(track.source),
    qdyText(track.id || track.qqMid || track.kugouHash),
    qdyNormalizeSong(track.title)
  ]
    .filter(Boolean)
    .join("-");
  var hosted = qdyCachedSubtitleHost(identifier);
  if (!hosted) {
    try {
      hosted = await qdyHostSubtitleText(identifier, lyricText, "lrc");
      qdyCacheSubtitleHost(identifier, hosted);
    } catch (error) {
      console.log(
        "[forward.quandouya] LRC 歌词托管失败:",
        qdySafeError(error)
      );
      return null;
    }
  }
  var fileURL = hosted && hosted.url;
  if (!/^https?:\/\/\S+$/i.test(fileURL)) return null;
  return {
    id: identifier,
    name: "LRC 歌词",
    title: "LRC 歌词",
    label: "LRC 歌词",
    file: fileURL,
    fileName: "quandouya-lyrics.lrc",
    lang: "zh-Hans",
    language: "zh-Hans",
    languageIdentifier: "zh-Hans",
    format: "lrc",
    mimeType: "text/plain; charset=utf-8",
    isDefault: true,
    default: true,
    selected: true,
    url: fileURL,
    sourceUrl: fileURL,
    type: "lrc",
    data: lyricText,
    content: lyricText,
    provider: [lyric.provider || "", hosted.provider || ""]
      .filter(Boolean)
      .join(" · ")
  };
}

async function qdyResolvePrimary(track, quality) {
  if (track.source === "netease") return qdyResolveNetease(track, quality);
  if (track.source === "qq") return qdyResolveQQ(track, quality);
  if (track.source === "kuwo") return qdyResolveKuwo(track, quality);
  if (track.source === "kugou") return qdyResolveKugou(track, quality);
  if (track.source === "migu") return qdyResolveMigu(track, quality);
  if (track.source === "qishui") return qdyResolveQishui(track, quality);
  throw new Error("无法识别歌曲平台");
}

async function qdyResolveKuwoFallback(track, quality) {
  if (!track.title) throw new Error("缺少歌曲名，无法执行回退");
  var keyword = [track.title, track.artist].filter(Boolean).join(" ");
  var songs = await qdySearchKuwo(keyword, 1, 10);
  var matched = songs.find(function (song) {
    return qdySongMatch(song.title, track.title);
  });
  if (!matched) throw new Error("备用酷我线路没有找到匹配歌曲");
  return qdyResolveKuwo(matched, quality);
}

async function qdyResolveNeteaseFallback(track, quality) {
  if (!track.title) throw new Error("缺少歌曲名，无法执行回退");
  var keyword = [track.title, track.artist].filter(Boolean).join(" ");
  var songs = await qdySearchNetease(keyword, 1, 10);
  var matched = songs.find(function (song) {
    return qdySongMatch(song.title, track.title);
  });
  if (!matched) throw new Error("备用网易云线路没有找到匹配歌曲");
  return qdyResolveNetease(matched, quality);
}

async function qdyResolveWithFallback(track, quality) {
  var errors = [];
  try {
    return await qdyResolvePrimary(track, quality);
  } catch (error) {
    errors.push(qdySafeError(error));
  }
  if (!qdyRuntime.fallback) {
    throw new Error("播放失败: " + errors.join("; "));
  }

  if (track.source !== "kuwo") {
    try {
      var kuwo = await qdyResolveKuwoFallback(track, quality);
      kuwo.fallback = true;
      return kuwo;
    } catch (error) {
      errors.push("酷我回退: " + qdySafeError(error));
    }
  }
  if (track.source !== "netease") {
    try {
      var netease = await qdyResolveNeteaseFallback(track, quality);
      netease.fallback = true;
      return netease;
    } catch (error) {
      errors.push("网易云回退: " + qdySafeError(error));
    }
  }
  throw new Error("所有播放线路均失败: " + errors.join("; "));
}

async function loadResource(params) {
  params = qdyApplySettings(params || {});
  var track = qdyTrackFromParams(params);
  var queueLink = qdyFirstText(
    track.link,
    typeof params.link === "string" ? params.link : "",
    typeof params.url === "string" &&
      params.url.indexOf("quandouya:") === 0
      ? params.url
      : ""
  );
  var queueParsed = qdyParseLink(queueLink);
  if (
    queueParsed.key &&
    (qdyPlaylists[queueParsed.key] ||
      queueParsed.key === "favorites" ||
      queueParsed.key.indexOf("chart:") === 0)
  ) {
    var episodeParts = qdyText(queueParsed.ep)
      .split("|")
      .map(function (part) {
        return parseInt(part, 10);
      })
      .filter(function (part) {
        return isFinite(part) && part > 0;
      });
    var requestedEpisode = parseInt(
      qdyFirstText(
        params.episode,
        params.episodeNumber,
        params.number
      ),
      10
    );
    var queueEpisode =
      isFinite(requestedEpisode) && requestedEpisode > 0
        ? requestedEpisode
        : episodeParts.length
          ? episodeParts[episodeParts.length - 1]
          : 1;
    try {
      var queueTracks;
      if (queueParsed.key.indexOf("chart:") === 0) {
        var chartKeyParts = queueParsed.key.split(":");
        queueTracks = await qdyChartTracks(
          params,
          chartKeyParts[1],
          chartKeyParts.slice(2).join(":")
        );
      } else {
        queueTracks = await qdyCategoryTracks(params, queueParsed.key);
      }
      var queuedTrack = queueTracks[queueEpisode - 1];
      if (queuedTrack) {
        track = qdyTrackFromParams({
          link: qdyTrackLink(
            queuedTrack,
            queueParsed.key,
            queueEpisode
          )
        });
      }
    } catch (error) {
      console.log(
        "[forward.quandouya] 播放队列定位失败:",
        qdySafeError(error)
      );
    }
  }
  var directURL = qdyFirstText(params.url, params.playUrl, params.audioUrl);
  if (/^https?:\/\/\S+\.(?:mp3|m4a|flac|aac|ogg)(?:[?#]|$)/i.test(directURL)) {
    var directLyric =
      qdyRuntime.lyrics && (track.source || track.title)
        ? await qdyFetchLyric(track)
        : null;
    var directSubtitle = await qdySubtitleTrack(track, directLyric);
    var directStream = {
      name: qdyFirstText(params.title, params.name, "全豆要音频"),
      description:
        "来源：全豆要音源\n线路：已解析音频直链" +
        (directSubtitle
          ? "\n歌词：" + directLyric.provider + " · 播放器内动态同步"
          : directLyric
            ? "\n歌词：已读取，但 LRC 轨道生成失败"
            : ""),
      url: directURL,
      playerType: qdyRuntime.playerType,
      source: "全豆要音源"
    };
    if (directSubtitle) {
      directStream.subtitles = [directSubtitle];
      directStream.externalSubtitles = [directSubtitle];
      directStream.subtitleTracks = [directSubtitle];
    }
    return [directStream];
  }

  if (!track.source) {
    throw new Error("无法识别当前歌曲的平台，请从全豆要音源列表重新选择");
  }
  if (!track.id && !track.kugouHash && !track.qqMid) {
    throw new Error("当前歌曲缺少平台 ID");
  }
  var quality = qdyQuality(params.quality || qdyRuntime.quality);
  var lyricPromise = qdyRuntime.lyrics
    ? qdyFetchLyric(track).catch(function (error) {
        console.log("[forward.quandouya] 歌词读取失败:", qdySafeError(error));
        return null;
      })
    : Promise.resolve(null);
  var resolved = await qdyResolveWithFallback(track, quality);
  var lyric = await qdyWithTimeout(lyricPromise, 8000);
  var subtitle = await qdySubtitleTrack(track, lyric);
  var title = qdyFirstText(track.title, params.title, params.name, "全豆要音频");
  var artist = qdyFirstText(track.artist, params.artist, params.singer);
  var displayName = [title, artist].filter(Boolean).join(" - ");
  var descriptionParts = [
    "来源：全豆要聚合音源",
    "播放平台：" + resolved.provider,
    "解析线路：" + resolved.line,
    "音质：" + resolved.quality
  ];
  if (qdyRuntime.lyrics) {
    descriptionParts.push(
      subtitle
        ? "歌词：" + lyric.provider + " · 播放器内动态同步"
        : lyric
          ? "歌词：已读取，但 LRC 轨道生成失败"
          : "歌词：暂无可用时间轴歌词"
    );
  }
  descriptionParts.push(
    resolved.fallback
      ? "当前平台受限，已自动切换备用线路"
      : "原平台线路"
  );
  var description = descriptionParts.join("\n");

  var stream = {
    name: displayName || "全豆要音频",
    description: description,
    url: resolved.url,
    playerType: qdyRuntime.playerType,
    source: "全豆要音源",
    musicSource: resolved.source,
    quality: resolved.quality,
    fallback: Boolean(resolved.fallback)
  };
  if (subtitle) {
    stream.subtitles = [subtitle];
    stream.externalSubtitles = [subtitle];
    stream.subtitleTracks = [subtitle];
  }
  return [stream];
}
