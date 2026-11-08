# Nexus 腾讯地图与导航

Nexus Wang · `nexus-tencent-map` · 1.0.1

腾讯原生地图、定位、搜索与驾车 / 货车 / 步行 / 骑行导航，新增 **离线轨迹记录与回放**。沿用 Nexus 米白、黑色、荧光黄绿视觉。

**普通授权 ¥59.90；源码授权 ¥1999.00。** 源码授权是 Nexus 封装代码的许可，腾讯位置服务的商业授权、导航服务与配额由使用方自行配置和承担，不包含在插件售价中。

> 2026-11-08 已在 Android 独立 Native 宿主验证并拍摄真实腾讯地图、服务器驾车路线及模拟导航。1.0.1 修复导航布局缺少 RecyclerView 和数据就绪事件的会话 ID 语义；本轮原生协议通过。该结果不等于 UTS / uvue 或 iOS 真机全量验收，具体范围见本文记录。封面为品牌插画，实机截图使用固定深圳示例坐标，不是设备实时位置。

## 功能

- 内嵌腾讯原生地图：中心与缩放、标记、折线、清理、状态查询和实例销毁。
- 显式申请前台定位权限；单次定位与持续前台定位；停止与页面隐藏 / 后台清理。
- 关键词、区域及周边 POI 搜索，地址解析与逆地址解析。
- 驾车、货车、步行、骑行 SDK 路线规划与返回路线选择，GPS 导航及模拟导航。开始调用的回调仅表示 SDK 接受请求，实际状态以 SDK 事件为准。
- 坐标距离 / 面积测量：球面近似值，单位米 / 平方米；用于简单多边形，不适用于自交、多环洞或测绘级精度。
- **新增离线轨迹记录与回放**：应用私有目录持久化、暂停 / 继续 / 结束、里程与时长、时间定位回放、JSON 导出、删除；不自动采集或上传位置。

## 平台与工程

市场沿用现有 UTS API 插件条目，同时提供下述兼容模式原生视图。1.0.1 已在 HBuilderX 5.34 以该分类完成 API、组件识别注册及 uvue 消费者编译；分类名称不扩大平台支持范围。

组件标签为 `<nexus-tencent-map>`，使用 UTS 兼容组件模式：uni-app 的 App nvue、uni-app x 的 App uvue VDOM。提供 Android Kotlin 与 iOS Swift 原生适配。普通 App vue / Web、小程序、鸿蒙、蒸汽模式不在本版组件范围内。消费者编译与 SDK 服务验收分别记录，不能从目录存在推断已完成全部跨平台测试。

建议 HBuilderX 5.34+。Android minSdk 23，腾讯导航原生库本版主要支持 ARM；iOS 13.4+、arm64 真机。iOS 模拟器不在本版交付架构内。包含三方原生依赖，须重新制作自定义基座 / 原生包，不能只靠标准基座热更新新增 SDK。

Android 固定 `tencent-map-nav-sdk-core:7.8.0`、`tencent-map-nav-sdk-tts:7.8.0`、`foundation:0.9.1.6875646-pro`、`androidx.constraintlayout:constraintlayout:2.1.4` 与 `androidx.recyclerview:recyclerview:1.3.2`；1.0.1 补齐导航布局所需的 RecyclerView，更新后须重新打包原生依赖。导航包已经内含地图 / 定位 / 搜索，勿再重复引入独立腾讯地图或定位包。iOS 使用官方 TencentNavKit 7.9.1 配套五个 framework 与资源包，通过插件 config 的官方 Pod 源集成，另固定 libwebp 依赖。

## 本地配置与初始化

1. 在腾讯位置服务控制台配置实际 Android 包名与签名、iOS Bundle ID，开通所需地图 / 定位 / 搜索 / 导航服务。
2. 将对应平台 Client Key 保留在宿主本地配置中。Android 必须先完成下方宿主 Manifest 配置，再向初始化 API 传入同一 Key；仅在演示页输入动态 Key 不能代替导航底图的原生配置。不要提交真实 Key 到公开仓库，不要把 SecretKey 放进客户端。
3. 宿主取得最终用户对腾讯 SDK 的隐私同意后，显式 `initializeTencentMap`；不自动请求定位。
4. 初始化回调成功再挂载组件，监听加载及错误事件。Key 配置不代表服务鉴权完成。
5. 需要定位时另行 `requestTencentLocationPermission`；导航必须先收到当前实例的真实路线结果。

### Android 宿主 Key 配置（必做）

腾讯官方快速集成要求同时配置 `<application>` 下的 `TencentMapSDK` 元数据和 SDK 初始化 Key。本插件的初始化 API 负责动态初始化，不能替代宿主打包时的元数据；普通地图视图可显示，也不能据此推定导航底图已取得正确配置。[腾讯官方快速集成](https://lbs.qq.com/mobile/AndroidNavigationX/guide/quick_integrate)

在**你自己的宿主工程根目录**创建或合并 `AndroidManifest.xml`。以下 `com.example.yourapp` 换成实际打包包名；已有文件仅合并所需节点，避免重复 `application` 或同名元数据：

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.example.yourapp">
    <application>
        <meta-data android:name="TencentMapSDK"
            android:value="${NEXUS_TENCENT_MAP_KEY}" />
    </application>
</manifest>
```

在同一宿主的 `nativeResources/android/manifestPlaceholders.json` 中添加以下字符串映射。示例值仅为占位文字，须在本地替换为实际 **Android Client Key**，并使其与 `initializeTencentMap({ key: ... })` 一致：

```json
{
  "NEXUS_TENCENT_MAP_KEY": "在本地替换为你的Android Client Key"
}
```

这是宿主本地打包配置，不是插件公共 `config.json` 的配置项，也不会自动读取系统环境变量。将含真实值的 `manifestPlaceholders.json` 排除在 Git / GitHub 与公共插件源码包之外；公开仓库只保留占位模板。Client Key 最终会进入客户端安装包，仍须在腾讯控制台限制包名与签名；不要把它当服务端 SecretKey。

按 DCloud 官方机制，根 Manifest 与 `nativeResources/android/manifestPlaceholders.json` 会在原生构建时合并。修改 Key、元数据或本版依赖后，**重新制作自定义调试基座 / 原生安装包并安装**；仅热更新页面或运行标准基座不会使这些配置生效。离线原生工程按官方方式手动合并 Manifest 与占位符。[DCloud Android 原生清单与资源配置](https://doc.dcloud.net.cn/uni-app-x/collocation/app-nativeresource-android.html#manifestplaceholders-json)

```ts
import { createTencentMapId, initializeTencentMap, planTencentRoutes,
  startTencentNavigation, destroyTencentMap } from '@/uni_modules/nexus-tencent-map'

// localKey 来自你自己的本地配置；userAgreed 来自宿主真实隐私交互。
const mapId = createTencentMapId()
initializeTencentMap({ key: localKey, privacyAgreed: userAgreed,
  success: (res: UTSJSONObject) => { /* 设置页面 mounted=true */ },
  fail: (err: UTSJSONObject) => { /* 展示 err，不伪造地图 */ }
})
```

```html
<nexus-tencent-map v-if="mounted" :key="mapId" :mapId="mapId" mode="drive"
  style="width:100%;height:420px" @map-event="onMapEvent" @mount-error="onMountError" />
```

`mapId` 与 `mode` 是实例创建参数。更换导航模式时先卸载旧组件，生成新 mapId，再挂载并重新规划；不要复用旧实例路线。SDK 实例各自持有视图与回调，每个插件进程最多同时启动一项导航。组件释放按原生对象身份清理，不会仅凭旧 ID 销毁其他新对象。

## API 形状

异步回调统一为 `{ code, message, data }`，`code=0` 成功，其他均失败。使用具名 `UTSJSONObject` 回调；不要把不同 Options 强行 cast 成同一类型。`complete` 在 success / fail 后各调用一次；回调在主线程，轨迹文件 IO 在有界串行队列。

- 初始化：`initializeTencentMap({key,privacyAgreed,success,fail,complete})`。
- 无实例查询：`getTencentMapReadiness({success,fail,complete})`、`revokeTencentMapPrivacy(...)`。
- 地图调用：`api({mapId,params,success,fail,complete})`。
- 轨迹调用：`api({params,success,fail,complete})`，不需要地图 Key / mapId。

| API | params |
| --- | --- |
| setTencentMapCenter | latitude, longitude, zoom? |
| addTencentMapMarker | id, latitude, longitude, title? |
| addTencentMapPolyline | id, points:[{latitude,longitude}], width?, color? |
| removeTencentMapMarker / removeTencentMapPolyline | id |
| clearTencentMapOverlays / getTencentMapState / destroyTencentMap | {} |
| requestTencentLocationPermission | {}，必须由明确用户操作触发 |
| getTencentLocation / startTencentLocation / stopTencentLocation | {}，Android需要前台精确定位权限；iOS需要WhenInUse授权，精度由系统近似/精确设置决定 |
| searchTencentPOI | keyword 与 region；或 keyword,center:{latitude,longitude},radius?,pageSize?,pageIndex? |
| geocodeTencentAddress | address,region? |
| reverseTencentGeocode | latitude,longitude |
| planTencentRoutes | origin:{latitude,longitude},destination:{latitude,longitude},mode；模式必须和组件一致 |
| startTencentNavigation | routeId,simulation:true/false,speed?,voiceEnabled?（默认true）；routeId 取本实例最新真实规划结果 |
| stopTencentNavigation | {} |
| measureTencentDistance / measureTencentArea | points:[{latitude,longitude}],coordinateSystem:'GCJ02' |

地图输入 / SDK 输出使用 GCJ02。轨迹可使用 GCJ02 或 WGS84，但每个会话内必须一致；WGS84 轨迹不得直接覆盖到 GCJ02 地图上当作已校准结果。本版不承诺货车高级自定义路线等需额外商业权益的能力。

## 离线轨迹与回放

```ts
import { createTencentTrack, appendTencentTrackPoint, replayTencentTrack } from '@/uni_modules/nexus-tencent-map'
createTencentTrack({params:{coordinateSystem:'GCJ02',timeMs:1000},
  success:(res:UTSJSONObject)=>{
    const data = res['data'] as UTSJSONObject
    const session = data['session'] as UTSJSONObject
    const sessionId = (session['sessionId'] as string | null) ?? ''
    // 下列点仅为合成示例，不是用户真实位置。
    appendTencentTrackPoint({params:{sessionId,coordinateSystem:'GCJ02',latitude:22.54,longitude:114.06,timeMs:2000}})
  }
})
```

| API | params / 返回 |
| --- | --- |
| createTencentTrack | coordinateSystem, timeMs；返回 data.session.sessionId |
| appendTencentTrackPoint | sessionId, coordinateSystem, latitude, longitude, timeMs |
| pauseTencentTrack / resumeTencentTrack / endTencentTrack | sessionId, timeMs |
| getTencentTrack | sessionId；返回含 points 的 session 与 summary |
| listTencentTracks | {}；返回 sessions 摘要 |
| replayTencentTrack | sessionId,timeMs；返回 position，含 pauseGap / interpolated / clamped / sourceTimeMs |
| exportTencentTrack | sessionId；返回 content JSON 字符串与 UTF-8 byteLength，由宿主决定保存 / 分享 |
| deleteTencentTrack | sessionId；实际删除后返回 deleted:true |

时间为整数毫秒，范围 0...9007199254740991。采样时间严格递增；暂停 / 继续 / 结束也须晚于上一事件。暂停期间禁止追加点，继续后创建新段，不跨段计算距离。回放在同段相邻样本间线性插值；暂停间隔保持上一真实点，明确 pauseGap=true；端点外查询 clamped=true。它是轨迹样本回放，不是路网匹配或导航预测。

默认每会话 5000 点、最多 20 会话、单文件 2MiB、全部 16MiB。使用应用私有不备份目录、文件锁及原子写入；写入失败保留原版本。未知字段、错坐标系、非有限坐标、坏 JSON、异常路径和超限均拒绝。轨迹不联网、不获取 GPS；后台会停止定位 / 导航，返回前台不会偷偷恢复已停止的采集。宿主录制真实点时应先获取用户同意，并仅在自己的前台记录开关开启时追加。

## 示例与边界

uni-app x 演示：`example/uniappx/map-demo.uvue`。输入 Key 前可以体验明确标注的合成离线轨迹；Key 不会由演示自动保存或输出日志。默认模拟导航，GPS 导航必须由宿主明确发起。封面不是 SDK 实拍图；真实地图图面仅作为另行标注的 Native QA 证据，不把合成轨迹当作定位或导航截图。

撤销隐私会停止本插件定位 / 导航并清理实例。Android SDK 同进程撤销后需要重启应用再初始化；iOS 行为见返回状态。不要与宿主其他腾讯 SDK 实例混用全局隐私设置而不协调。授权、网络、定位权限、平台限制都会导致真实失败，宿主应展示错误并允许用户停止。

## 跨端参数与事件边界

周边搜索统一使用 `center`、`radius`（米）、`pageIndex`、`pageSize`。Android 原生搜索半径1..50000米，iOS当前接口10..1000米；跨端使用10..1000米，超限会返回失败而不截断。路线规避拥堵使用 `avoidCongestion`。途经点跨端安全上限15个；不同模式以SDK实际返回的路线数量为准，不承诺每次都有多条。

`map_loaded` 为Android SDK加载回调；iOS `map_authenticated`表示鉴权成功、`map_rendered`表示首帧完成。`navigation_started` / `navigation_stopped` / `navigation_start_failed`代表SDK实际导航事件；`speech_started`等语音状态以平台SDK实际回调为准。开始API的成功不是这些事件的替代。

Android 驾车 `navigation_data_ready` 的 `data.navSessionId` 是 SDK 导航会话标识，应与 `planTencentRoutes` 成功结果中的 `data.navSessionId` 匹配；`data.navSessionIdAvailable=false` 时不能据此确认就绪。用于开始导航的仍是 `data.routes[n].routeId`。1.0.1 保留事件中的旧 `data.routeId` 作为已弃用的会话标识别名，并以 `routeIdIsDeprecatedNavSessionAlias=true` 标注；它不是算路路线 ID，不要用于 `startTencentNavigation`。此字段修正不把步行、骑行或 iOS 事件推定为同一形状。

### Android 货车路线参数

以下JSON可作为`planTencentRoutes({mapId,params,...})`的`params`，其中`mapId`必须属于已挂载的`mode="truck"`组件。示例经纬度与车牌均为合成格式示例，不是本机位置或真实车辆资料；实际调用必须替换为车辆真实参数及该车辆车牌。字段形状合法不代表Key已获货车服务授权或所选路线已通过服务端鉴权。

```json
{
  "mode": "truck",
  "origin": { "latitude": 22.54, "longitude": 114.06, "coordinateSystem": "GCJ02" },
  "destination": { "latitude": 22.56, "longitude": 114.08, "coordinateSystem": "GCJ02" },
  "licenseNumber": "粤B12345",
  "avoidCongestion": true,
  "avoidHighway": false,
  "avoidToll": false,
  "truck": {
    "length": 10,
    "width": 2.5,
    "height": 4,
    "weight": 20,
    "load": 10,
    "axisLoad": 4,
    "axisCount": 2,
    "plateColor": "Blue",
    "trailerType": "Container",
    "truckType": "Medium",
    "energyType": "Diesel",
    "functionType": "Normal",
    "emissionStandard": "V",
    "passType": "NoNeed"
  }
}
```

`licenseNumber`及上述truck字段在Android本版均必填，大小写必须与枚举一致。长度、宽度、高度单位米；weight、load、axisLoad单位吨。axisCount为整数。不得把参数缺失降级为普通驾车。Android扩展字段与iOS的`truck.type`等不是自动互换，跨端调用请分别按公开平台表填写，或由宿主显式转换真实车辆资料。

官方SDK7.8公开枚举字符串：

- `plateColor`：`Unknown`、`Blue`、`Yellow`、`Black`、`White`、`Green`、`YellowGreen`。

- `trailerType`：`Unknown`、`Flatbed`、`Container`、`Semi`、`Full`。

- `truckType`：`Unknown`、`Mini`、`Light`、`Medium`、`Heavy`。

- `energyType`：`Unknown`、`Diesel`、`Hybrid`、`Electric`、`Gas`。

- `functionType`：`Normal`、`Danger`。

- `emissionStandard`：`Unknown`、`I`、`II`、`III`、`IV`、`V`、`VI`。

- `passType`：`NoNeed`、`Have`、`NotHave`、`Approval`。

### iOS 货车路线参数

同样需要已挂载mode="truck"的实例、origin/destination与licenseNumber。iOS本版truck.type是整数1微型/2轻型/3中型/4重型，和Android枚举字符串并不互换。必填length米0.1..50、width/height米0.1..10、weight吨0.1..200；可选load吨0..200默认0、axisCount整数2..10默认2、axisLoad吨0..100默认0。这是本桥的输入限制，不是腾讯服务承诺合法车辆一定有路线。

```json
{"mode":"truck","origin":{"latitude":22.54,"longitude":114.06},"destination":{"latitude":22.56,"longitude":114.08},"licenseNumber":"粤B12345","truck":{"type":2,"length":6.8,"width":2.3,"height":2.8,"weight":8,"load":3,"axisCount":2,"axisLoad":4}}
```

以上同为合成格式示例，业务中填写实际车辆。两个平台的SDK字段不同，本版未公开的高级字段不视为支持；不要用任意示例车牌运行真实货车导航。

## 本版验证记录

| 范围 | 结果与边界 |
| --- | --- |
| Android UTS API + 兼容原生组件 + 完整 uvue 演示页 | HBuilderX 5.34 VDOM 编译通过；未验证该 uvue 页面的手机在线流程，独立 Native 真机结果见下方 |
| uni-app nvue 接入 | Vue2 / Vue3 工程均编译通过，未做 iOS nvue 设备验收 |
| iOS 消费者 | 官方UTS生成的组件/API Swift + 5个真实混编源，针对真实DCloud iPhone运行库和TencentNavKit 7.9.1，在arm64 iOS13.4目标完成类型检查与实际链接；不是签名安装或iPhone运行验收 |
| 离线轨迹引擎与桥分发 | Kotlin JVM 36/36、Swift Foundation macOS 38/38，测试真实文件、坏数据、事务回滚、分段回放和跨语言导出；Android34原生API编译通过 |
| 距离 / 面积算法 | Kotlin 18/18、Swift 23/23；这是坐标算法测试，不是SDK在线服务测试 |
| Android Native 真机复验（2026-11-08） | Redmi 22101317C / Android 14；真实地图及标记、真实驾车算路、模拟导航画面、实际开始/停止和 TTS 开始/结束回调已观察；8 次 Native 接口回调均一次、主线程、code=0；不是 UTS/uvue 设备验收 |
| 未完成验证 | 全量业务服务鉴权、POI/地理编码在线响应、GPS 导航、物理扬声器可听性、UTS/uvue 真机在线流程、多机型稳定性、iOS 设备与签名打包 |

### 2026-11-08 Android 真机记录与截图

- Redmi 22101317C / Android 14 的独立 Native 宿主实际显示腾讯底图与标记。补齐 `RecyclerView 1.3.2` 并配置宿主 `TencentMapSDK` 元数据后，驾车导航视图创建成功，原 `InflateException` 未再出现；包中已检查真实 RecyclerView / ConstraintLayout 类定义。
- 腾讯服务器返回 3 条真实驾车路线；本轮所选示例约 3,895 米、13 分钟、50 个几何点。模拟导航使用 SDK 返回的真实路线 ID，显示转向、车道、路口放大图、模拟车标及剩余里程；不是手绘路线或外部地图跳转。
- 已修正 SDK `navigation_data_ready` 的首参语义：它是导航会话 ID。实测 `plan.navSessionId` 与实际就绪事件 `data.navSessionId` 精确匹配；路线 ID 单独用于选择真实路线，没有拿会话标识冒充路线。
- 实际观察到地图加载、真实路线、`navigation_started`、匹配会话的 `navigation_data_ready`、TTS `speech_started` / `speech_ended` 和 `navigation_stopped`。本轮 8 次 Native 接口回调均为一次、主线程、`code=0`，无协议超时或生命周期中断；原生协议 `allObservedConditionsPassed=true`。TTS 回调不代表已独立核验扬声器可听性。
- 全程使用固定深圳 GCJ02 公开示例，不申请定位、不读取设备 GPS；未测试货车、步行、骑行、在线搜索或 iOS 设备。测试宿主直接调用本插件的原生实现，**不是 uni-app / uvue 运行截图**。

![Android 原生 SDK 真机地图：固定深圳示例](https://awak3n1ngone.github.io/nexus-uniapp-plugins/assets/screens/nexus-tencent-map-native-map.png)

![Android 原生 SDK 真机模拟导航：非 GPS 导航](https://awak3n1ngone.github.io/nexus-uniapp-plugins/assets/screens/nexus-tencent-map-native-simulation.png)

配置与服务结果必须在使用方环境验收；本地源码和消费者编译不等于在线服务可用。

官方资料：[腾讯Android快速集成](https://lbs.qq.com/mobile/AndroidNavigationX/guide/quick_integrate)、[DCloud Android宿主配置](https://doc.dcloud.net.cn/uni-app-x/collocation/app-nativeresource-android.html)、[腾讯Android导航SDK](https://lbs.qq.com/mobile/AndroidNavigationX/guide/summary)、[腾讯iOS导航SDK](https://lbs.qq.com/mobile/ios_nav_sdk/guide/summary)、[UTS兼容组件](https://doc.dcloud.net.cn/uni-app-x/plugin/uts-component-compatible.html)。功能范围参考[插件27671的公开介绍](https://ext.dcloud.net.cn/plugin?id=27671)。
