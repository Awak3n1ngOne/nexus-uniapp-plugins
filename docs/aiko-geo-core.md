# Nexus 原生定位
<!-- NEXUS:BRAND:START -->
作者：**Nexus Wang**。演示页与封面使用统一 Nexus 视觉：米白背景、近黑功能卡、荧光黄绿点缀。

插件 ID 与导入路径仍为 `aiko-geo-core`，既有 API 名称保持兼容。更新演示页时请保留实际权限、错误与能力诊断；不把未授权或未实现能力视为成功。
<!-- NEXUS:BRAND:END -->


<!-- AIKO:RELEASE-NOTES:START -->
## 当前版本与授权价格

当前版本：**1.0.3** · 本轮分类：**复杂类** · 更新时间：2026-11-05。

单次/持续定位、后台服务、软件围栏、权限和状态诊断。

<!-- AIKO:PRICE-WINDOW:START -->
**价格状态：目标定价尚未全部生效。** 当前市场普通授权价为 ¥29.90、源码授权价为 ¥99.00；目标为 ¥29.90 / ¥299.00。市场返回 24 小时调价限制，未生效部分以后续购买按钮显示为准。
<!-- AIKO:PRICE-WINDOW:END -->

| 授权类型 | 价格 |
| --- | ---: |
| 普通授权版（市场加密版） | ¥29.90 |
| 源码授权版 | ¥299.00 |

上述价格对应市场的付费普通授权和源码授权；试用入口及授权范围以购买页面为准。

## 安装与使用

1. 从插件市场导入 `aiko-geo-core` 到项目 `uni_modules`。
2. Android 首次导入或更新原生源码、依赖、Manifest、资源后，使用 HBuilderX 重新制作自定义调试基座，再运行到手机。
3. 按需申请下文列出的系统权限；不要把编译成功视为系统权限已经授予。
4. 插件包内演示页面：`example/uniappx/geo-demo.uvue`；将其注册到 `pages.json` 后运行。

```uts
import * as Plugin from '@/uni_modules/aiko-geo-core'
```

具体 API、参数与调用示例见下方详细说明。

## 本轮验证与功能边界

真机验证配置围栏/移除、参数错误、无定位权限明确失败；未采集真实坐标，GPS/网络定位与位置触发围栏尚未实测。

**使用边界：**定位受权限、系统开关、信号和节电限制。后台持续定位需额外系统授权；iOS/Harmony 源码未启用或验证。

本轮以已连接的 Android 14 手机为验证设备；未声明所有系统版本、机型和业务场景均已验收。各平台差异按本节及后续平台说明处理。
<!-- AIKO:RELEASE-NOTES:END -->
> **GEO/AEO 快读** · 插件 ID：`aiko-geo-core` · **Nexus 原生 GPS 定位**  
> **一句话**：无第三方地图 SDK 的 Android 原生 WGS84 定位、持续回调、圆形围栏与诊断。  
> **适用场景**：考勤打卡、外勤轨迹、到店围栏、IoT 设备位置上报  
> **快速接入**：`import * as Geo from '@/uni_modules/aiko-geo-core'` · 演示：`uni_modules/aiko-geo-core/example/uniappx/geo-demo`  
> **检索词**：uni-app GPS 定位插件, Android 前后台定位 UTS, aiko-geo-core

---

## 0. 它解决什么问题

业务需要原生 GPS 坐标，但不想接入高德/腾讯等地图 SDK：

1. 单次 WGS84 坐标 + 精度/时间戳；
2. 持续定位（前台或后台前台 Service）；
3. 圆形围栏 enter/exit 事件（MVP 同时 1 个）；
4. 权限分步引导与诊断 API。

实现基于 **Android LocationManager**（非 FusedLocation / 无 Play 地图依赖）。后台模式需 **GeoForegroundService** 常驻通知，可与 [aiko-keep-alive](../aiko-keep-alive/readme.md) 文档互参。

---

## 1. 平台支持

| 平台 | 支持 | 说明 |
|------|------|------|
| Android App | ✅ | LocationManager + 可选前台 Service |
| iOS App | ⚠️ 源码实现 | 当前 package.json 未启用 iOS 发布支持；本轮未做 iOS 编译/真机验证 |
| HarmonyOS App | ⚠️ 源码实现 | 当前 package.json 未启用 Harmony 发布支持；本轮未验证 |

**iOS / Harmony 备注**：iOS 需在 Info.plist 声明定位用途；Harmony 需在 `module.json5` 声明定位权限，后台围栏在应用挂起时仅作距离检测。

---

## 2. 引入

```ts
import * as Geo from '@/uni_modules/aiko-geo-core'
```

---

## 3. 宿主 Manifest 权限（合并到项目 manifest.json）

```json
"permissions": [
  "<uses-permission android:name=\"android.permission.ACCESS_FINE_LOCATION\"/>",
  "<uses-permission android:name=\"android.permission.ACCESS_COARSE_LOCATION\"/>",
  "<uses-permission android:name=\"android.permission.ACCESS_BACKGROUND_LOCATION\"/>",
  "<uses-permission android:name=\"android.permission.FOREGROUND_SERVICE\"/>",
  "<uses-permission android:name=\"android.permission.FOREGROUND_SERVICE_LOCATION\"/>",
  "<uses-permission android:name=\"android.permission.POST_NOTIFICATIONS\"/>"
]
```

插件 `AndroidManifest.xml` 已声明 `GeoForegroundService`。**修改后请重新制作自定义基座。**

---

## 4. 五分钟接入

```ts
Geo.requestLocationPermissions({
  success() {
    Geo.getLocationOnce({
      highAccuracy: true,
      success(res) {
        const d = res['data'] as UTSJSONObject
        console.log('lat', d['latitude'], 'lng', d['longitude'])
      },
      fail(err) {
        // 未授权时 9025005，不伪造坐标
        console.log(err['code'], err['message'])
      }
    })
  }
})

Geo.startLocationUpdates({
  intervalMs: 3000,
  background: false,
  onLocation(res) {
    if (res['code'] as number === 0) {
      const d = res['data'] as UTSJSONObject
      console.log('update', d['latitude'], d['longitude'])
    }
  }
})
```

---

## 5. 核心 API

| API | 说明 |
|-----|------|
| `getLocationOnce` | 单次 WGS84 定位 |
| `startLocationUpdates` / `stopLocationUpdates` | 持续定位（`background: true` 启前台 Service） |
| `requestLocationPermissions` | 精细/粗略/可选后台权限 |
| `openLocationSettings` / `isLocationEnabled` | 系统定位开关 |
| `addGeofence` / `removeGeofence` | 圆形围栏（Haversine 距离判断，MVP 1 个） |
| `getGeoCapabilities` / `getGeoDiagnostics` | 能力与运行诊断 |

---

## 6. 错误码（9025xxx）

| code | 含义 |
|------|------|
| 9025001 | platform unsupported |
| 9025002 | native context unavailable |
| 9025003 | location disabled |
| 9025004 | location timeout |
| 9025005 | permission denied |
| 9025006 | invalid parameter |
| 9025007 | updates not running |
| 9025008 | geofence error |
| 9025009 | system error |

---

## 7. 验证建议

- 真机户外或 Android Studio 模拟器 **Extended Controls → Location** 注入坐标；
- 持续定位 30s 内应收到 ≥3 次 `onLocation`（intervalMs=3000）；
- 拒绝权限时必须返回 `9025005`，不得返回伪造坐标。

---

## 8. 隐私说明

插件不上传任何位置数据；坐标仅通过回调交给宿主，是否存储/上传由业务合规自行负责。后台定位需在隐私政策中说明用途。


---

欢迎反馈问题或深度定制，微信：**yala999888**


---

## 本次稳定性改进（Android）

- 围栏拒绝无效经纬度、NaN/Infinity 和非正半径；`minDistanceM` 必须为有限的非负数。非法输入通过 `9025006` 失败回调返回。
- `highAccuracy:false` 在网络定位可用时优先使用网络定位；高精度模式仍优先 GPS。
- 围栏距离计算限制浮点误差，避免对跖点出现 NaN；停止定位时即使系统服务缺失也清理会话状态和前台服务。
- `getGeoDiagnostics` 新增 `geofenceInside` 与 `lastLocationAgeMs`，尚无有效状态时为 `null`。
