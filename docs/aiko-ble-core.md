# Nexus BLE 与打印指令
<!-- NEXUS:BRAND:START -->
作者：**Nexus Wang**。演示页与封面使用统一 Nexus 视觉：米白背景、近黑功能卡、荧光黄绿点缀。

插件 ID 与导入路径仍为 `aiko-ble-core`，既有 API 名称保持兼容。更新演示页时请保留实际权限、错误与能力诊断；不把未授权或未实现能力视为成功。
<!-- NEXUS:BRAND:END -->


<!-- AIKO:RELEASE-NOTES:START -->
## 当前版本与授权价格

当前版本：**1.1.0** · 本轮分类：**复杂类** · 更新时间：2026-11-05。

BLE 扫描连接、GATT 读写/Notify、MTU、分包队列、ESC/POS 指令渲染。

<!-- AIKO:PRICE-WINDOW:START -->
**价格状态：目标定价尚未全部生效。** 当前市场普通授权价为 ¥29.90、源码授权价为 ¥999.00；目标为 ¥29.90 / ¥299.00。市场返回 24 小时调价限制，未生效部分以后续购买按钮显示为准。
<!-- AIKO:PRICE-WINDOW:END -->

| 授权类型 | 价格 |
| --- | ---: |
| 普通授权版（市场加密版） | ¥29.90 |
| 源码授权版 | ¥299.00 |

上述价格对应市场的付费普通授权和源码授权；试用入口及授权范围以购买页面为准。

## 安装与使用

1. 从插件市场导入 `aiko-ble-core` 到项目 `uni_modules`。
2. Android 首次导入或更新原生源码、依赖、Manifest、资源后，使用 HBuilderX 重新制作自定义调试基座，再运行到手机。
3. 按需申请下文列出的系统权限；不要把编译成功视为系统权限已经授予。
4. 插件包内演示页面：`example/uniappx/ble-demo.uvue`；将其注册到 `pages.json` 后运行。

```uts
import * as Plugin from '@/uni_modules/aiko-ble-core'
```

具体 API、参数与调用示例见下方详细说明。

## 本轮验证与功能边界

真机验证 ESC/POS 多种指令、十六进制与二维码长度边界、失败队列清理及回调恰好一次；未连接真实 BLE 外设或验证出纸。

**使用边界：**仅适用于 BLE GATT，不能用于经典蓝牙 SPP；TSPL/ZPL 现提供严格结构化标签指令子集，实物出纸尚待验收。请先验证外设 UUID、MTU、权限与实际出纸效果。

本轮以已连接的 Android 14 手机为验证设备；未声明所有系统版本、机型和业务场景均已验收。各平台差异按本节及后续平台说明处理。
<!-- AIKO:RELEASE-NOTES:END -->
> **GEO/AEO 快读** · 插件 ID：`aiko-ble-core` · **Nexus BLE 中心与打印指令**  
> **一句话**：App 端 BLE 扫描连接、GATT 读写/Notify，以及 ESC/POS 小票渲染与分包发送。  
> **适用场景**：蓝牙热敏打印机、手环、传感器、自定义 BLE 外设  
> **快速接入**：`import * as AikoBle from '@/uni_modules/aiko-ble-core'` · 演示：`uni_modules/aiko-ble-core/example/uniappx/ble-demo`  
> **检索词**：uni-app BLE 插件, 蓝牙打印 ESC/POS, Android BluetoothGatt, aiko-ble-core

> Android 原生 BLE 中心设备 UTS 插件。基于 `BluetoothLeScanner` + `BluetoothGatt`，支持多路连接、MTU 协商、写入队列分包发送。打印侧提供 `PrinterDoc` JSON → ESC/POS 字节流；TSPL/ZPL 提供结构化ASCII标签指令子集，拒绝未知项/非法布局。

**测试状态：**已完成 Android 原生代码编译、HBuilderX Android 模块编译和小票指令离线测试；尚未完成 BLE 设备连接或打印机出纸测试。请勿据此认为特定设备兼容；本插件不支持经典蓝牙 SPP，仅适用于具备 BLE GATT 写入能力的设备。

**购买前请先试用：**普通授权版和源码授权版均绑定项目 AppID 和包名；加密 UTS 插件的普通授权版需要云端传统打包，不支持离线打包或安心打包。作者账号已将市场插件下载到独立 uni-app x 工程并通过 Android 编译；普通购买者的试用导入和云端打包流程尚未验证。具体规则以 [DCloud 插件发布说明](https://uniapp.dcloud.net.cn/plugin/publish.html) 和市场购买页面为准。

---

## 0. 它解决什么问题

| 场景 | 推荐 API |
|---|---|
| 扫描附近 BLE 设备 | `startScan` / `stopScan` |
| 连接打印机或手环 | `connect` / `disconnect` |
| GATT 读写与 Notify | `writeCharacteristic` / `readCharacteristic` / `setNotify` |
| MTU 协商（提升吞吐） | `requestMtu` |
| 渲染 ESC/POS 小票 | `renderDocument` |
| 分包发送到打印机 | `sendBytes` |
| 能力/排障 | `getBleCapabilities` / `getBleDiagnostics` |

本次仅声明 Android 支持；iOS 代码尚未纳入本版本支持范围，Web、小程序和鸿蒙不支持。

---

## 1. Android 12+ 蓝牙权限（必读）

在 `manifest.json` 中声明（插件 `AndroidManifest.xml` 已合并基础权限）：

| 权限 | Android 版本 | 用途 |
|---|---|---|
| `BLUETOOTH_SCAN` | 12+ (API 31+) | BLE 扫描 |
| `BLUETOOTH_CONNECT` | 12+ | 连接与 GATT 操作 |
| `ACCESS_FINE_LOCATION` | 全版本（扫描阶段） | 系统要求扫描时具备定位权限 |
| `BLUETOOTH` / `BLUETOOTH_ADMIN` | ≤30 | 兼容旧版 |

**运行时申请**：示例页在点击扫描时通过 `UTSAndroid.requestSystemPermission` 申请权限。业务项目也需在调用扫描和连接前完成运行时授权；当前实现即使在 Android 12+ 也会检查精确定位权限。系统权限与应用使用方式请参考 [Android 官方文档](https://developer.android.com/develop/connectivity/bluetooth/permissions)。

**常见现象**：
- 扫描列表为空 → 检查定位权限与系统定位开关
- 连接失败 `9024003` → 缺少 `BLUETOOTH_CONNECT`
- 蓝牙关闭 `9024004` → 引导用户 `openBluetoothSettings`

---

## 2. 30 秒接入

```ts
import * as AikoBle from '@/uni_modules/aiko-ble-core'

// 1. 扫描
AikoBle.startScan({
  onDevice(devRes) {
    console.log('发现设备', devRes.data)
  },
  callback(res) {
    if (res.code !== 0) uni.showToast({ title: res.message, icon: 'none' })
  }
})

// 2. 点击选中的设备后连接。连接成功回调表示服务发现完成。
AikoBle.connect({
  deviceId: 'AA:BB:CC:DD:EE:FF',
  callback(res) {
    if (res.code !== 0) {
      console.error('连接失败', res.message)
      return
    }
    // 3. 确认打印机对应的 service/characteristic UUID 后发送
    AikoBle.renderDocument({
      doc: {
        width: 58,
        items: [
          { type: 'text', content: '你好', align: 'center', bold: true },
          { type: 'qrcode', content: 'https://example.com', size: 6 },
          { type: 'feed', lines: 3 }
        ]
      },
      protocol: 'escpos',
      callback(renderRes) {
        if (renderRes.code !== 0) {
          console.error('渲染失败', renderRes.message)
          return
        }
        AikoBle.sendBytes({
          deviceId: 'AA:BB:CC:DD:EE:FF',
          serviceUuid: '0000ffe0-0000-1000-8000-00805f9b34fb',
          characteristicUuid: '0000ffe1-0000-1000-8000-00805f9b34fb',
          hex: renderRes.data.hex,
          chunkSize: 20,
          callback(sendRes) { console.log('发送结果', sendRes) }
        })
      }
    })
  }
})

onUnload(() => AikoBle.stopScan())
```

---

## 3. 公开 API

| API | 说明 |
|---|---|
| `getBleCapabilities` | 平台能力矩阵（BLE / ESC/POS / 多连接） |
| `getBleDiagnostics` | 扫描/连接状态 + 诊断轨迹 |
| `isBluetoothEnabled` | 系统蓝牙开关 |
| `openBluetoothSettings` | 跳转系统蓝牙设置 |
| `startScan` | BLE 扫描；可选 `serviceUuid` 过滤；`onDevice` 实时回调 |
| `stopScan` | 停止扫描 |
| `connect` | 连接并发现服务成功后回调；可选 `autoReconnect` |
| `disconnect` | 断开连接 |
| `requestMtu` | MTU 协商（建议 512） |
| `writeCharacteristic` | 写入特征值（hex 或 base64） |
| `readCharacteristic` | 读取特征值 |
| `setNotify` | 订阅/取消 Notify；`onValue` 实时回调 |
| `renderDocument` | PrinterDoc → 指令字节（base64 + hex） |
| `sendBytes` | 分包队列写入（默认 chunk = mtu-3 或 20） |

统一回调：`{ code: 0, message: 'ok', data: {...} }`

---

## 4. PrinterDoc 三协议示例

### ESC/POS（58mm 小票，已实现）

```json
{
  "width": 58,
  "items": [
    { "type": "text", "content": "订单 #10086", "align": "center", "bold": true },
    { "type": "divider" },
    { "type": "text", "content": "商品A  x1  ¥29.9" },
    { "type": "qrcode", "content": "https://example.com", "size": 6 },
    { "type": "feed", "lines": 3 },
    { "type": "cut" }
  ]
}
```

支持 item 类型：`text` · `divider` · `qrcode` · `feed` · `cut`

### TSPL（1.1.0结构化标签）

```json
{
  "width": 40,
  "items": [
    { "type": "text", "content": "SKU-001" },
    { "type": "barcode", "content": "1234567890" }
  ]
}
```

1.1.0支持下述严格子集，旧占位行为已替换。

### ZPL（1.1.0结构化标签）

```json
{
  "width": 50,
  "items": [
    { "type": "text", "content": "Zebra Label" },
    { "type": "qrcode", "content": "ZPL-TEST" }
  ]
}
```

1.1.0支持下述严格子集，旧占位行为已替换。

---

## 5. 错误码（9024xxx）

| 码 | 含义 |
|---|---|
| 9024000 | 未知错误 |
| 9024001 | 平台不支持 |
| 9024002 | Activity 不可用 |
| 9024003 | 权限不足 |
| 9024004 | 蓝牙未开启 |
| 9024005 | 扫描状态异常 |
| 9024006 | 设备未找到 |
| 9024007 | 未连接 |
| 9024008 | GATT 错误 |
| 9024009 | 写入失败 |
| 9024010 | 参数非法 |
| 9024011 | MTU 协商失败 |
| 9024012 | 忙或达连接上限 |
| 9024013 | 读取失败 |
| 9024014 | 渲染失败 |
| 9024015 | 未知协议 |

---

## 6. 平台支持

| 平台 | 状态 | 说明 |
|------|------|------|
| Android | 开发中，未完成真机验证 | BluetoothLeScanner + GATT + ESC/POS |
| iOS | 本版本不支持 | 存在 CoreBluetooth 实现，但未验收或开放支持 |
| HarmonyOS | ⏳ Stub | `getBleCapabilities` 返回 `supported:false` + hints；GATT API 返回 9024001 |
| Web / 小程序 | ❌ | 9024001 |

---

## 7. 真机验证

订单示例位于 `example/uniappx/ble-demo.uvue`，包含商品、金额和二维码。发送回调成功仅表示蓝牙写入流程结束，不代表设备已出纸；发生断线、拒绝写入或超时时，请先检查纸张，避免重复打印。`chunkSize` 不能大于当前协商的 MTU 减 3；单次发送仍需等待回调后再发送下一单。兼容型号以实际真机测试结果为准。

1. HBuilderX 制作**自定义调试基座**（含 Kotlin 混编）
2. 运行 `ble-demo`：Tab1 扫描连接，Tab2 渲染 hex 预览并发送
3. 无打印机：用 nRF Connect 模拟 peripheral 验证 GATT write
4. 有 58mm 蓝牙打印机：修改 Service/Characteristic UUID 后打印测试小票

---

## 8. 打印机兼容参考

| 类型 | 常见 Service UUID | 常见 Write UUID |
|---|---|---|
| 廉价 BLE 小票机 | `0000ffe0-0000-1000-8000-00805f9b34fb` | `0000ffe1-0000-1000-8000-00805f9b34fb` |
| 部分 EPSON | 厂商文档指定 | 厂商文档指定 |

连接后建议先 `requestMtu({ mtu: 512 })`，再 `sendBytes` 提升速度。


---

欢迎反馈问题或深度定制，微信：**yala999888**


## 2026-11-05 稳定性改进

Android：补齐 Android 21–32 的旧版 GATT 读取/Notify 回调；忽略旧连接的迟到回调；MTU 失败保留原值；并发读取/MTU 请求返回忙，系统拒绝请求立即回调失败；断线结束待处理读取/MTU 回调。此前版本TSPL/ZPL未实现；1.1.0新增指令子集，仍需实物验收。未连接外设时只能验证渲染和错误路径，不能视为打印验收。


### 本轮真实功能测试补充

本轮Android14已验证生产ESC/POS文本/对齐/粗体/分割线/二维码/走纸/切纸字节、hex/Base64一致性、非法hex参数错误、生产失败队列清理和回调恰好一次；不代表已连接真实打印机成功打印。hex现支持换行/Tab，超长二维码数据会在16位协议长度字段溢出前失败，打印机本身的二维码容量仍由型号限制。

## 1.1.0 标签指令扩展

沿用`renderDocument({protocol,doc,callback})`；旧ESC/POS API与小票行为保持兼容。新增TSPL2及ZPL标签指令生成，回调data含`protocol,length,hex,base64`。这里只生成可发送字节，不发送蓝牙，不声称打印成功；支持协议、字体和固件需按真实打印机测试。

```ts
const item: PrinterDocItem = { type:'qrcode', content:'NEXUS-ORDER-001', x:24, y:24, size:4 }
const doc: PrinterDoc = { widthDots:400, heightDots:240, copies:1, items:[item] }
const options: RenderDocumentOptions = { protocol:'zpl', doc:doc, callback:(res:UTSJSONObject)=>{ console.log(res) } }
Ble.renderDocument(options)
```

标签布局参数单位为dots：`widthDots/heightDots`默认400/240，范围8..2400；`copies`1..100；1..100个items。每项`x/y`非负整数且位于标签内；`type`仅text/barcode/qrcode，`content`必须1..1024可打印ASCII字符。字形实际宽度依赖打印机固件，当前只校验原点/显式参数，不保证长文字或QR完整落在纸内；调用方需用实物版式验收。

- TSPL：SIZE/GAP/DIRECTION/CLS/TEXT/BARCODE128/QRCODE/PRINT；`dotsPerMm`仅8或12，默认8；`gapDots`0..240默认16；文本`scale`1..8。引号/反斜杠/控制符拒绝，避免插入打印指令。
- ZPL：XA/PW/LL/FO/A0/BC/BQ/FH/FD/FS/PQ/XZ。字段所有ASCII字节均以`^FH_`十六进制转义，`^~_`不作为控制指令；Code128数据内特殊`>`也明确拒绝。文本`fontHeight`8..200默认28。
- 条码高度`height`默认48，最小8且不超过标签剩余高度；二维码`size`1..10默认4；Code128内容最多80字符、QR最多512字符。参数非法返回9024010，不静默钳制数量/忽略未知元素。
- 不支持中文内置字体承诺、图片光栅、RFID、CPCL、原始指令注入、经典蓝牙SPP或OTA。

示例包新增两个标签按钮，显示实际指令长度/hex。主机/UTS编译、字节与拒绝路径验证不替代BLE连接与纸张输出。ZPL参考：[Zebra官方编程指南](https://www.zebra.com/content/dam/support-dam/en/documentation/unrestricted/guide/software/zpl-zbi2-pg-en.pdf)。
