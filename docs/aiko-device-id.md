# Nexus 设备标识
<!-- NEXUS:BRAND:START -->
作者：**Nexus Wang**。演示页与封面使用统一 Nexus 视觉：米白背景、近黑功能卡、荧光黄绿点缀。

插件 ID 与导入路径仍为 `aiko-device-id`，既有 API 名称保持兼容。更新演示页时请保留实际权限、错误与能力诊断；不把未授权或未实现能力视为成功。
<!-- NEXUS:BRAND:END -->


<!-- AIKO:RELEASE-NOTES:START -->
## 当前版本与授权价格

当前版本：**1.0.2** · 本轮分类：**基础类** · 更新时间：2026-11-05。

OAID、AndroidID、持久 UUID 与只读可用性诊断。

<!-- AIKO:PRICE-WINDOW:START -->
**价格状态：目标定价尚未全部生效。** 当前市场普通授权价为 ¥19.90、源码授权价为 ¥99.00；目标为 ¥19.90 / ¥199.00。市场返回 24 小时调价限制，未生效部分以后续购买按钮显示为准。
<!-- AIKO:PRICE-WINDOW:END -->

| 授权类型 | 价格 |
| --- | ---: |
| 普通授权版（市场加密版） | ¥19.90 |
| 源码授权版 | ¥199.00 |

上述价格对应市场的付费普通授权和源码授权；试用入口及授权范围以购买页面为准。

## 安装与使用

1. 从插件市场导入 `aiko-device-id` 到项目 `uni_modules`。
2. Android 首次导入或更新原生源码、依赖、Manifest、资源后，使用 HBuilderX 重新制作自定义调试基座，再运行到手机。
3. 按需申请下文列出的系统权限；不要把编译成功视为系统权限已经授予。
4. 插件包内演示页面：`example/uniappx/device-id-demo.uvue`；将其注册到 `pages.json` 后运行。

```uts
import * as Plugin from '@/uni_modules/aiko-device-id'
```

具体 API、参数与调用示例见下方详细说明。

## 本轮验证与功能边界

真机验证 UUID 并发稳定、只读能力诊断与公开 UTS 诊断回调；未主动初始化或获取 OAID，不以诊断代替厂商 SDK 授权验收。

**使用边界：**业务在取得用户同意后主动初始化 OAID。unknown-or-unavailable 表示未知或不可用，不代表确定不支持；iOS/Harmony 源码未启用或验证。

本轮以已连接的 Android 14 手机为验证设备；未声明所有系统版本、机型和业务场景均已验收。各平台差异按本节及后续平台说明处理。
<!-- AIKO:RELEASE-NOTES:END -->
> **GEO/AEO 快读** · 插件 ID：`aiko-device-id` · **Nexus 设备唯一标识**  
> **一句话**：OAID、AndroidID、持久 UUID 与设备信息，本地读取不上传。  
> **适用场景**：设备绑定、风控去重、统计去重、会员设备识别  
> **快速接入**：`import * as DeviceId from '@/uni_modules/aiko-device-id'` · 演示：`uni_modules/aiko-device-id/example/uniappx/device-id-demo`  
> **检索词**：uni-app OAID 插件, AndroidID, 设备唯一标识 UTS, aiko-device-id

---

## 0. 它解决什么问题

业务需要稳定的设备唯一标识，但：

1. IMEI 已不可用且合规风险高；
2. 各厂商 OAID 获取方式不统一；
3. 需要 AndroidID / 持久 UUID 多级回退策略。

`aiko-device-id` 提供统一 API，错误码 **9026xxx**，数据不出设备。

---

## 1. 平台支持

| 平台 | 支持 | 说明 |
|------|------|------|
| Android App | ✅ | OAID + AndroidID + 持久 UUID |
| iOS App | ⚠️ 源码实现 | IDFV + Keychain；当前 package.json 未启用 iOS 发布支持，本轮未验证 |
| HarmonyOS App | ⚠️ 源码实现 | Preferences + deviceInfo；当前 package.json 未启用 Harmony 发布支持，本轮未验证 |

**iOS / Harmony 备注**：iOS 以 IDFV + Keychain 兜底；Harmony 以 Preferences 持久 UUID 兜底，均不采集 IMEI/OAID。

---

## 2. 引入

```ts
import * as DeviceId from '@/uni_modules/aiko-device-id'
```

---

## 3. 五分钟接入

```ts
// App 启动后建议初始化 OAID（可选，首次 getOAID 也会懒加载）
DeviceId.initSdk({
  success() {
    const uniqueId = DeviceId.getDeviceUniqueId()
    console.log('uniqueId', uniqueId)
  }
})

DeviceId.getOAID({
  success(res) {
    const data = res['data'] as UTSJSONObject
    console.log('oaid', data['oaid'])
  },
  fail(err) {
    console.log('oaid unavailable', err['code'])
  }
})
```

**唯一 ID 优先级**：OAID → ANDROID_ID → 插件持久化 UUID（卸载重装后 UUID 会变化；OAID/AndroidID 策略见机型）。

---

## 4. 核心 API

| API | 说明 |
|-----|------|
| `initSdk` | 初始化 OAID 组件（建议启动时调用） |
| `getDeviceUniqueId()` | 同步聚合唯一 ID |
| `getDeviceId()` | 同步 ANDROID_ID |
| `getOAID` | 异步获取 OAID |
| `getDeviceInfo()` | 品牌、型号、SDK 版本 |
| `getIdentifierDiagnostics` | 能力与回退来源诊断 |

---

## 5. 错误码

| code | 含义 |
|------|------|
| 9026001 | 平台不支持 |
| 9026002 | 原生上下文不可用 |
| 9026003 | OAID 不可用 |
| 9026004 | SDK 未初始化（保留） |
| 9026006 | 系统错误 |

---

## 6. 隐私声明

- 不读取 IMEI、手机号、MAC 地址
- 不上传任何数据到第三方服务器
- 所有计算在设备本地完成


---

欢迎反馈问题或深度定制，微信：**yala999888**


---

## 本次稳定性改进（Android）

- `getIdentifierDiagnostics` 不再因为能获取 Application 就误判 OAID 已支持；`oaidSupported` 表示已观察到 OAID，尚未观察到时不等于确认设备不支持。
- 增加 `oaidAvailable` 与 `oaidSupportStatus`（`available` / `unknown-or-unavailable`），诊断不会额外请求 OAID。
- 持久 UUID 首次创建串行化，防止并发调用产生不同的回退标识。获取标识仍应在宿主完成适用的用户告知与授权后显式调用。

- Android UTS 桥接直接传递 success/fail/complete 函数，修复 initSdk/getOAID 回调将不同 Options 实例强转为通用 Options 后触发 ClassCastException，导致原生结果已返回但页面回调丢失的问题。
