# Nexus 原生流媒体播放
<!-- NEXUS:BRAND:START -->
作者：**Nexus Wang**。演示页与封面使用统一 Nexus 视觉：米白背景、近黑功能卡、荧光黄绿点缀。

插件 ID 与导入路径仍为 `aiko-live-player`，既有 API 名称保持兼容。更新演示页时请保留实际权限、错误与能力诊断；不把未授权或未实现能力视为成功。
<!-- NEXUS:BRAND:END -->


<!-- AIKO:RELEASE-NOTES:START -->
## 当前版本与授权价格

当前版本：**1.0.2** · 本轮分类：**复杂类** · 更新时间：2026-11-05。

LibVLC 原生播放器、常用流媒体协议、重连、静音、截图与组件 API。

| 授权类型 | 价格 |
| --- | ---: |
| 普通授权版（市场加密版） | ¥29.90 |
| 源码授权版 | ¥299.00 |

上述价格对应市场的付费普通授权和源码授权；试用入口及授权范围以购买页面为准。

## 安装与使用

1. 从插件市场导入 `aiko-live-player` 到项目 `uni_modules`。
2. Android 首次导入或更新原生源码、依赖、Manifest、资源后，使用 HBuilderX 重新制作自定义调试基座，再运行到手机。
3. 按需申请下文列出的系统权限；不要把编译成功视为系统权限已经授予。
4. 插件包内演示页面：`example/uniappx/live-player-demo.uvue`；将其注册到 `pages.json` 后运行。

```uts
import * as Plugin from '@/uni_modules/aiko-live-player'
```

具体 API、参数与调用示例见下方详细说明。

## 本轮验证与功能边界

真机 LibVLC 实际播放本地 MP4，收到 playing 并取得非空 PixelCopy 截图；重连/释放边界通过。新标准组件整工程编译通过，但未做各网络协议和组件播放端到端验收。

**使用边界：**更新 LibVLC/原生资源后需重建自定义基座。流地址、编码、鉴权及网络环境影响播放；iOS 组件仍为占位实现，当前不支持。

本轮以已连接的 Android 14 手机为验证设备；未声明所有系统版本、机型和业务场景均已验收。各平台差异按本节及后续平台说明处理。
<!-- AIKO:RELEASE-NOTES:END -->

## 本次稳定性更新

- uni-app x VDOM 示例使用与声明一致的 camelCase 属性名（`playerId`、`:autoPlay`）；避免旧版运行器对 kebab-case 属性绑定不触发更新。

- 修复首次 `play()` 重复绑定已 attach 的 LibVLC 视频输出导致异常；已绑定时只更新视口尺寸，Surface 销毁后才重新绑定。

- 补齐真实 `components/aiko-live-player/aiko-live-player.uvue` 标准组件入口：`native-view` 绑定 Android LibVLC 视图，转发 `onStateChange` / `onError`，公开 ref 的播放、暂停、停止、换源和截图方法。
- 属性支持 `playerId`、`src`、`autoPlay`、`muted`、`transport`、`reconnect`；页面卸载释放播放器和事件回调。更改静音或重连配置不会从头重播。
- 原 `component.uts` 仅为历史注释文件，组件由新增 easycom 路径提供，不依赖注释自动生成。

- 手动暂停、停止或切换地址会撤销重连意图，延迟的错误事件不再重启已停止播放。
- 截图先检测系统能力，成功与错误分支释放 Bitmap 并删除失败文件；超时避免回收仍由 PixelCopy 使用的图片。
- iOS 组件仍为占位实现，能力诊断与平台标识不再宣称可播放。

新增组件入口仅面向 **uni-app x Android 标准模式**。普通 uni-app App 当前只提供能力诊断 API，没有接通 Vue / nvue 的实际组件播放入口；不要将本插件的普通 uni-app 导入成功理解为能播放。组件 ref 使用框架 `ComponentPublicInstance` 与 `$callMethod`；历史 `AikoLivePlayerComponentPublicInstance` 仅保留类型描述，不能把它当实际 Vue 实例。

当前可用主平台为 **Android**；iOS 目录为占位代码，尚不能用于生产。


HBuilderX **5.08+** 起，内置 `<video>` 组件在 App 端**不再支持** RTSP、RTMP、HTTP-FLV 等监控/直播协议。本插件提供 `<aiko-live-player>` UTS 原生组件，基于 **LibVLC** 实现低延迟播放。

## 支持协议（MVP）

| 协议 | 示例 |
|------|------|
| RTSP | `rtsp://192.168.1.100:554/stream1` |
| RTMP | `rtmp://live.example.com/app/stream` |
| HTTP-FLV | `http://live.example.com/live/stream.flv` |
| HLS | `http://live.example.com/live/stream.m3u8` |

## 快速开始

```vue
<aiko-live-player
  ref="player"
  playerId="cam1"
  :src="rtspUrl"
  :autoPlay="true"
  :muted="true"
  transport="tcp"
  @onStateChange="onState"
  @onError="onErr"
  style="width: 100%; height: 220px;"
/>
```

```typescript
import { LivePlayerSnapshotOptions } from '@/uni_modules/aiko-live-player'

const player = ref<ComponentPublicInstance | null>(null)

player.value?.$callMethod('play')
player.value?.$callMethod('pause')
player.value?.$callMethod('stop')
player.value?.$callMethod('setUrl', 'rtsp://...')
const options: LivePlayerSnapshotOptions = {
  success(res: UTSJSONObject) { console.log(res.getString('path')) }
}
player.value?.$callMethod('snapshot', options)
```

## 局域网摄像头示例

```text
# 海康/大华等 ONVIF 摄像头（子码流，降低延迟）
rtsp://admin:password@192.168.1.64:554/Streaming/Channels/102

# 通用 RTSP（TCP 更稳定，UDP 延迟略低）
transport="tcp"   # 插件自动附加 :rtsp-tcp
```

## 低延迟默认参数

LibVLC 初始化选项：

- `:network-caching=300`
- `:rtsp-tcp`（transport=tcp 时）
- `:clock-jitter=0`

## 自动重连

播放错误或断流时，按指数退避重试（默认最多 3 次）。可在组件配置中调整 `reconnect.maxRetries`、`initialBackoffMs`。

## 错误码（9027xxx）

| 码 | 含义 |
|----|------|
| 9027001 | 平台不支持 |
| 9027002 | 原生上下文不可用 |
| 9027003 | 参数错误 |
| 9027004 | RTSP 连接超时 / 重连耗尽 |
| 9027005 | 播放错误 |
| 9027006 | 截图失败 |
| 9027007 | URL 为空 |
| 9027008 | LibVLC 初始化失败 |
| 9027009 | 播放器未就绪 |

## 包体积说明

`libvlc-all` AAR 约 **100MB+**（含多 ABI so）。首版通过 Maven 依赖引入；自定义基座首次编译需下载依赖。建议发布时仅保留 `arm64-v8a`（后续版本可配置 abiFilters）。

## 平台支持

| 平台 | 状态 |
|------|------|
| Android | ✅ LibVLC MVP |
| iOS | ⚠️ AVPlayer 能力诊断 + 组件 Stub（RTSP/RTMP/FLV 返回 9027001） |
| HarmonyOS | ⏳ 能力 Stub + 组件 Stub（Phase 2 IJK/LibVLC） |

## 演示页

`uni_modules/aiko-live-player/example/uniappx/live-player-demo.uvue`

## 第三方许可

见 [LICENSE-THIRD-PARTY.md](./LICENSE-THIRD-PARTY.md)（LibVLC LGPL-2.1）。

## 自定义基座

修改 `utssdk/app-android/*.kt` 或 `config.json` 后，请在 HBuilderX 重新**制作自定义调试基座**。


---

欢迎反馈问题或深度定制，微信：**yala999888**
