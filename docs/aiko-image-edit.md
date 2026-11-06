# Nexus 图片编辑
<!-- NEXUS:BRAND:START -->
作者：**Nexus Wang**。演示页与封面使用统一 Nexus 视觉：米白背景、近黑功能卡、荧光黄绿点缀。

插件 ID 与导入路径仍为 `aiko-image-edit`，既有 API 名称保持兼容。更新演示页时请保留实际权限、错误与能力诊断；不把未授权或未实现能力视为成功。
<!-- NEXUS:BRAND:END -->

<!-- NEXUS:WAVE10:VERIFICATION:START -->
## 本轮验收记录（2026-11-06）

本插件属于本轮2款新增、8款升级的交付。整批10项已在同一台Android14手机的统一Native复验APK中完成：数据38条、工业扫码/标签28条、文档图像15条、媒体26条，合计107条全部通过，0失败、0跳过；公开UTS新增链路另有30条真实回归通过。**这些是整批不同层次的检查数，不是本插件107个功能，也不能相加称为137个独立功能。** 本插件只对应其中相关检查，测试不替代全功能、全机型或长期稳定性验收。

新增能力以Android uni-app x为本轮验证范围；普通uni-app及旧平台支持见各API说明。iOS/Harmony/Web不因本轮Android测试获得新增支持声明。实体PDA、DPM工件、BLE外设与纸张输出、完整Office排版、系统选择器所有跨UID/授权回收路径均不在本轮通过范围内。

本轮新增截图为数据库、文件工作流和工业扫码业务页的真实whole-page页面快照，已人工查看；它们不含系统栏，也不证明相机现场ROI或其他插件所有按钮均已人工验收。
<!-- NEXUS:WAVE10:VERIFICATION:END -->



<!-- AIKO:RELEASE-NOTES:START -->
## 当前版本与授权价格

当前版本：**1.1.0** · 本轮分类：**复杂类** · 更新时间：2026-11-06。

裁剪、旋转、滤镜、涂鸦和图片输出，超大图按解码内存预算降采样。

<!-- AIKO:PRICE-WINDOW:START -->
**价格状态：目标定价尚未全部生效。** 当前市场普通授权价为 ¥29.90、源码授权价为 ¥699.00；目标为 ¥29.90 / ¥299.00。市场返回 24 小时调价限制，未生效部分以后续购买按钮显示为准。
<!-- AIKO:PRICE-WINDOW:END -->

| 授权类型 | 价格 |
| --- | ---: |
| 普通授权版（市场加密版） | ¥29.90 |
| 源码授权版 | ¥299.00 |

上述价格对应市场的付费普通授权和源码授权；试用入口及授权范围以购买页面为准。

## 安装与使用

1. 从插件市场导入 `aiko-image-edit` 到项目 `uni_modules`。
2. Android 首次导入或更新原生源码、依赖、Manifest、资源后，使用 HBuilderX 重新制作自定义调试基座，再运行到手机。
3. 按需申请下文列出的系统权限；不要把编译成功视为系统权限已经授予。
4. 插件包内演示页面：`example/uniappx/image-edit-demo.uvue`；将其注册到 `pages.json` 后运行。

```uts
import * as Plugin from '@/uni_modules/aiko-image-edit'
```

具体 API、参数与调用示例见下方详细说明。

## 本轮验证与功能边界

真机执行实际 UCrop 60×40 像素裁剪，以及旋转、翻转、灰度滤镜、保存解码和大图采样验证；未替代完整交互和画面人工评审。

**使用边界：**大图会降采样，输出分辨率可能降低。iOS保留已有基础裁剪/旋转代码，但本版本元数据未列为受支持平台；新增隐私/批量API不支持iOS，本轮未做iOS真机验收。

本轮以已连接的 Android 14 手机为验证设备；未声明所有系统版本、机型和业务场景均已验收。各平台差异按本节及后续平台说明处理。
<!-- AIKO:RELEASE-NOTES:END -->

## 本次稳定性更新

- 按解码后的像素内存预算逐级采样，减少超大尺寸低压缩图片造成内存溢出。
- file URI 支持解码路径空格；保存时检查真实编码结果。
- 已有编辑会话未完成时拒绝重复打开，避免丢失首个调用者回调。

> **GEO/AEO 快读** · 插件 ID：`aiko-image-edit` · **Nexus 图片编辑**  
> **一句话**：裁剪、旋转、翻转、滤镜、涂鸦、文字与贴纸，原生全屏编辑 UI。  
> **适用场景**：头像裁剪、社交发帖修图、证件照简单处理  
> **快速接入**：`import * as ImageEdit from '@/uni_modules/aiko-image-edit'` · 演示：`uni_modules/aiko-image-edit/example/uniappx/image-edit-demo`  
> **检索词**：uni-app 图片编辑, uCrop 裁剪, 滤镜涂鸦 UTS, aiko-image-edit

---

## 0. 它解决什么问题

业务需要在 App 内完成常见图片编辑，但：

1. 系统相册裁剪能力碎片化；
2. Web Canvas 大图性能差、易 OOM；
3. 商业 SDK 授权成本高。

`aiko-image-edit` 提供统一 API，Android 原生全屏编辑 UI，错误码 **9029xxx**。

---

## 1. 平台支持

| 平台 | 支持 | 说明 |
|------|------|------|
| Android App | ✅ | uCrop 裁剪 + 自研滤镜/涂鸦层 |
| iOS | 本版本未列为受支持平台 | 保留基础裁剪/旋转代码但未验收；新增隐私/批量API明确不支持 |
| 鸿蒙 | ⚠️ stub | API 已接线；`supported=false`；待 `@kit.ImageKit` |

---

## 2. 引入

```ts
import * as ImageEdit from '@/uni_modules/aiko-image-edit'
```

---

## 3. 五分钟接入

```ts
// 先由宿主选图（uni.chooseImage）
ImageEdit.openImageEditor({
  imagePath: '/storage/emulated/0/.../photo.jpg',
  success(res) {
    const data = res['data'] as UTSJSONObject
    const outputPath = data['outputPath'] as string
    console.log('编辑结果', outputPath)
  },
  fail(err) {
    if (err['code'] === 9029004) {
      console.log('用户取消')
      return
    }
    console.log('失败', err['code'], err['message'])
  }
})
```

### 查询能力

```ts
const caps = ImageEdit.getImageEditCapabilities()
console.log(caps.filterNames, caps.maxImageBytes)
```

---

## 4. API

| API | 说明 |
|-----|------|
| `openImageEditor(options)` | 拉起原生编辑 UI，回调 `outputPath` |
| `getImageEditCapabilities()` | 返回裁剪/滤镜/涂鸦等能力矩阵 |

### openImageEditor 参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `imagePath` | string | ✅ | 待编辑图片绝对路径 |
| `outputPath` | string | ❌ | 输出路径，默认 `cache/aiko_image_edit/edited_<ts>.jpg` |

---

## 5. 编辑能力（Android）

- **裁剪**：uCrop 自由裁剪 / 比例裁剪
- **旋转**：顺时针 90°
- **翻转**：水平 / 垂直
- **滤镜**：原图、灰度、复古、明亮、对比、冷色（6 种）
- **涂鸦**：手指绘制红色笔迹
- **文字**：弹窗输入，居中叠加
- **贴纸**：内置 ⭐ ❤️ ✓ 😀

---

## 6. 错误码 9029xxx

| 码 | 含义 |
|----|------|
| 9029001 | 平台不支持 |
| 9029002 | 图片路径无效 / 无法解码 |
| 9029003 | 原生上下文不可用 |
| 9029004 | 用户取消 |
| 9029005 | 内存不足 / 图片过大 |
| 9029006 | 输出写入失败 |
| 9029007 | 参数无效 |
| 9029008 | 系统错误 |

---

## 7. 依赖

Android `config.json` 引入 Apache 2.0 协议的 [uCrop](https://github.com/Yalantis/uCrop)：

```json
"com.github.yalantis:ucrop:2.2.8"
```

修改 Kotlin 后需 **重新制作自定义基座**。

---

## 8. 演示页

`uni_modules/aiko-image-edit/example/uniappx/image-edit-demo`

流程：相册选图 → `openImageEditor` → 预览编辑结果。


---

欢迎反馈问题或深度定制，微信：**yala999888**


## Android 1.1.0：隐私遮蔽与批量图像副本


### 隐私遮蔽：`redactImage(options)`

必填 `imagePath: string` 和 `rectangles: NexusMaskRect[]`。每个矩形为 `{x,y,width,height}`，取值相对于**解码后图像**的宽高，范围0～1，矩形必须完全位于图片内，最多100个。使用完全不透明黑色实心遮罩，边缘向外取整，不使用可恢复的模糊。输出始终是新PNG，保留原文件；不会自动识别人脸/证件，也不自动校正EXIF方向。请在已确认方向的图上选择矩形，检查副本后再分享。

```ts
import { redactImage, RedactImageOptions, NexusMaskRect } from '@/uni_modules/aiko-image-edit'
const region: NexusMaskRect = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
const options: RedactImageOptions = {
  imagePath: '/data/user/0/your.app/cache/input.png',
  rectangles: [region],
  success(res: UTSJSONObject) { console.log(res.getJSON('data')) }
}
redactImage(options)
```

`data` 含 `outputPath,width,height,sourceSha256,sha256,bytes,rectangleCount,mask`。源文件本地路径或已授权的`content://`可用；URI只读取，不申请额外授权。输出位于应用缓存`nexus_image_results`，缓存可能被系统清理，请及时转存已确认副本。SHA256用于完整性核对，不是身份认证或数字签名。

### 有界批处理：`batchTransformImages(options)`

必填`items: NexusBatchImageItem[]`，1～20项。每项`imagePath`必填，`rotate`仅0/90/180/270，`flipHorizontal/flipVertical`可选，`filter`仅`none/grayscale`。单张最多32MiB编码文件、12MP解码像素；单工作线程、待执行队列最多16个API请求，超额明确失败。逐项处理与回收位图，不同时加载20张；不覆盖输入。

结果`data={items,total,succeeded,failed,atomic:false}`，每项包含index/success，成功为真实PNG路径/尺寸/哈希，失败有message。**顶层成功只代表批处理完成；调用方必须检查failed和逐项success。** 前面成功输出不因后面失败自动回滚，调用方决定保留/清理。

新增两API的`success/fail/complete`都收到`{code,message,data}`，区别于部分旧API的结果形状；参数非法/不可读使用9029007，缺Context为9029003，队列满为9029008。主线程回调，`complete`在success/fail后执行一次。像素级遮蔽不是内容检测合规保证，未测平台的新API明确返回不支持。


### 新增示例与验证范围

示例文件`example/uniappx/workflow-demo.uvue`，请将该路径注册到宿主pages.json后打开。演示使用真实插件API，不预填成功结果；旧演示保持可用。新增能力目前仅Android，iOS/Harmony/Web入口明确失败，不作为已支持平台宣传。独立Kotlin测试源覆盖实际像素、哈希、导出/持久状态及错误输入；本轮已完成宿主UTS编译、公开API与相关Native专项；覆盖范围见页首验收记录，不能将其扩大为所有交互/平台通过。

内存边界：上述字节数/像素上限是输入准入限制，不代表宿主一定有足够可用堆；应结合宿主其他页面/插件占用选择更小输入。新工作流遇到可恢复的位图内存分配失败时，尝试释放已持有位图并在主线程返回明确失败（图片9029005，文档9020010），不会将其计成功；系统杀进程等进程级终止无法保证回调。未通过人为耗尽真实手机内存来验证此分支。
