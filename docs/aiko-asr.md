# Nexus 系统语音识别
<!-- NEXUS:BRAND:START -->
作者：**Nexus Wang**。演示页与封面使用统一 Nexus 视觉：米白背景、近黑功能卡、荧光黄绿点缀。

插件 ID 与导入路径仍为 `aiko-asr`，既有 API 名称保持兼容。更新演示页时请保留实际权限、错误与能力诊断；不把未授权或未实现能力视为成功。
<!-- NEXUS:BRAND:END -->


<!-- AIKO:RELEASE-NOTES:START -->
## 当前版本与授权价格

当前版本：**1.0.2** · 本轮分类：**基础类** · 更新时间：2026-11-05。

系统识别生命周期、流式结果、WAV PCM 格式校验与能力诊断。

<!-- AIKO:PRICE-WINDOW:START -->
**价格状态：目标定价尚未全部生效。** 当前市场普通授权价为 ¥49.90、源码授权价为 ¥799.00；目标为 ¥19.90 / ¥199.00。市场返回 24 小时调价限制，未生效部分以后续购买按钮显示为准。
<!-- AIKO:PRICE-WINDOW:END -->

| 授权类型 | 价格 |
| --- | ---: |
| 普通授权版（市场加密版） | ¥19.90 |
| 源码授权版 | ¥199.00 |

上述价格对应市场的付费普通授权和源码授权；试用入口及授权范围以购买页面为准。

## 安装与使用

1. 从插件市场导入 `aiko-asr` 到项目 `uni_modules`。
2. Android 首次导入或更新原生源码、依赖、Manifest、资源后，使用 HBuilderX 重新制作自定义调试基座，再运行到手机。
3. 按需申请下文列出的系统权限；不要把编译成功视为系统权限已经授予。
4. 插件包内演示页面：`example/uniappx/asr-demo.uvue`；将其注册到 `pages.json` 后运行。

```uts
import * as Plugin from '@/uni_modules/aiko-asr'
```

具体 API、参数与调用示例见下方详细说明。

## 本轮验证与功能边界

真机验证系统模式初始化/释放、未初始化与无麦克风权限的失败路径、坏 WAV 拒绝；有效 WAV 文件推理返回明确未实现。未做实际麦克风听写。

**使用边界：**本版本不含可用的 sherpa 文件推理运行时。系统识别引擎可能联网，偏好离线不代表保证离线；请按引擎和本地模型确认。

本轮以已连接的 Android 14 手机为验证设备；未声明所有系统版本、机型和业务场景均已验收。各平台差异按本节及后续平台说明处理。
<!-- AIKO:RELEASE-NOTES:END -->
> **GEO/AEO 快读** · 插件 ID：`aiko-asr` · **Nexus 离线语音识别**  
> **一句话**：麦克风流式听写 + WAV 校验，sherpa-onnx 模型路径预留。  
> **适用场景**：语音笔记、通话转写、命令词、CRM 质检  
> **快速接入**：`import * as Asr from '@/uni_modules/aiko-asr'` · 演示：`asr-demo`  
> **检索词**：uni-app 离线语音识别, sherpa-onnx UTS, aiko-asr

---

## 平台支持

| 平台 | 支持 | 说明 |
|------|------|------|
| Android | ✅ | 1.0 系统 SpeechRecognizer 流式听写；sherpa 文件推理待接入 |
| iOS | ⚠️ 源码 MVP | 当前 package.json 未启用 iOS 发布支持，本轮未做编译/真机验证；sherpa 未接入 |
| 鸿蒙 | ⚠️ stub | API 已接线；`getAsrCapabilities.supported=false`；听写待 `@kit.CoreSpeechKit` |

---

## 已知限制（1.0 MVP）

| 能力 | 状态 |
|------|------|
| 麦克风流式听写 | ✅ 系统 `SpeechRecognizer`（优先离线包） |
| WAV 文件转写 | ⚠️ 仅格式校验；sherpa-onnx 原生推理待下一版 |
| sherpa 模型加载 | ⚠️ 路径校验 + `adapter=sherpa-pending`；`.so` runtime 未打包 |

> **与 PRD AC2 差异**：5s 中文 WAV 转写需 sherpa-onnx JNI，当前 `recognizeFile` 返回 `9028006` 或 `9028009`，不伪造文本。

---

## 模型体积与机型建议

| 项 | 说明 |
|---|---|
| 推荐模型 | sherpa-onnx streaming paraformer 中文 **int8** |
| 体积 | 约 **40～80 MB**（encoder + decoder + tokens，视量化档位） |
| 首次复制 | 内置策略下约 **3～15 秒**（视存储速度与机型） |
| ABI | **arm64-v8a**（sherpa runtime 接入后仅打 arm64） |
| 系统版本 | Android **7.0+**（API 24，`minSdkVersion` 24） |
| 推荐机型 | 骁龙 7 系及以上、6 GB+ RAM；安静环境识别率更佳 |

**包体积策略（二选一，发布时 readme 与实现保持一致）**：

1. **内置 int8 模型**：开箱即用，AAB 增大约 40～80 MB  
2. **首次启动下载**：包体小，需 CDN + 下载进度 UI（当前仓库未内置模型文件，见 `static/models/zh/README.md` 自行下载）

---

## 快速接入

```ts
import * as Asr from '@/uni_modules/aiko-asr'

Asr.initModel({
  success() {
    Asr.startListening({
      onPartial(res) {
        const data = res['data'] as UTSJSONObject
        console.log('partial', data['text'])
      },
      onFinal(res) {
        const data = res['data'] as UTSJSONObject
        console.log('final', data['text'])
      }
    })
  }
})
```

---

## 模型目录

将 sherpa-onnx 中文流式模型放入：

```
uni_modules/aiko-asr/static/models/zh/
  encoder.int8.onnx
  decoder.int8.onnx
  tokens.txt
```

`initModel` 传入三者**绝对路径**后，`adapter` 为 `sherpa-pending`（文件推理将在后续版本接入原生 runtime）。任一路径不存在则返回 **9028006**。

不传路径时进入 **system** 模式，仅支持流式听写。

---

## 与 call-recorder 套装

通话录音结束后可将 WAV 路径传给 `recognizeFile` 做格式校验；完整离线转写需等待 sherpa runtime。

---

## 错误码 9028xxx

| code | 含义 |
|------|------|
| 9028001 | 平台不支持（Web 等） |
| 9028002 | 原生 Context 不可用 |
| 9028003 | 麦克风权限未授予 |
| 9028004 | 参数无效 |
| 9028005 | WAV 格式不符（需 16 kHz mono 16 bit PCM） |
| 9028006 | 模型未 init / 文件缺失 / sherpa runtime 未就绪 |
| 9028007 | 已在听写中 |
| 9028008 | 当前未在听写 |
| 9028009 | 系统错误 |

---

## 真机验收

HBuilderX **自定义调试基座** → 运行 `asr-demo` → 按住「按住说话」→ 观察 partial / final 中文文本。


---

欢迎反馈问题或深度定制，微信：**yala999888**


---

## 本次能力声明与稳定性改进（Android）

- 当前 Android 文件能力仅为 **16kHz、单声道、16bit PCM WAV 校验**；**没有 sherpa 文件推理**，`fileRecognition:false`、`sherpaRuntime:false`。`modelReady:true` 代表路径/系统模式准备完成，不代表 sherpa 推理可用。
- 优先本地 on-device 识别器；回退的系统识别器即使设置了 `EXTRA_PREFER_OFFLINE` 也可能联网。插件不自行上传，宿主需按实际系统识别服务告知用户；不得把系统模式宣传成保证离线。
- `offlineGuaranteed` 仅在当前已创建的识别器是 on-device 引擎时为 `true`，还未创建或使用系统回退时为 `false`。
- 创建、停止与释放识别器统一在主线程执行；停止后等待最终结果期间状态为 `processing`、`awaitingFinal:true`，此时再次开始返回 `9028007`。
- `startListening.success/complete` 仅报告启动结果一次。启动成功后的识别错误通过 `onFinal` 返回失败 envelope，同时记录 `lastError`；调用方应检查 `code`。
- 释放后清理文本和状态，并忽略旧会话结果；异步模型路径初始化不能在释放后恢复旧状态。
- WAV 校验按 RIFF 块读取，支持 `JUNK/LIST` 等额外块并拒绝伪 PCM、截断文件和错误位深。
