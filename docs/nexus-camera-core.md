# Nexus 自定义相机

**Nexus Wang · Android uni-app x · 1.0.1**

把真实相机预览嵌入自己的页面，在预览旁放置业务按钮与说明。支持 JPEG 拍照、MP4 录像、前后摄、缩放、对焦、补光、实际预览帧抓取与像素取色。提供严格拍摄模板和每份产物的 SHA256 证据侧车。

普通授权 ¥29.90，源码授权 ¥299.00。仅 Android uni-app x 标准模式，Android 6.0 / API 23+；其他平台、普通 uni-app、后台或隐藏拍摄未实现。正式机型的相机、编码器与分辨率能力由设备决定。

## 接入与权限

依赖 CameraX 1.6.1（camera-core/camera-camera2/camera-lifecycle/camera-view/camera-video），由 app-android/config.json 声明。宿主 Activity 必须实现 LifecycleOwner。新增依赖/权限后重建调试基座。Manifest 声明 CAMERA 与 RECORD_AUDIO；运行时只在显式 requestCameraPermissions 时申请，audio 未设或 false 不申请录音权限。

```vue
<template>
  <view style="height: 320px;">
    <nexus-camera-core :cameraId="cameraId" @ready="onReady" @statechange="onState" />
  </view>
  <button @click="start">启动预览</button>
</template>
<script setup lang="uts">
import * as Camera from '@/uni_modules/nexus-camera-core'
import { CameraOptions } from '@/uni_modules/nexus-camera-core'
const cameraId = 'order-camera'
function onReady(res: UTSJSONObject): void { console.log('mounted', res) }
function onState(res: UTSJSONObject): void { console.log('actual state', res) }
function start(): void {
  const permission: CameraOptions = {
    cameraId,
    success: (res: UTSJSONObject) => {
      const options: CameraOptions = { cameraId, mode: 'PHOTO' }
      Camera.startCamera(options)
    },
    fail: (err: UTSJSONObject) => { console.log(err) }
  }
  Camera.requestCameraPermissions(permission)
}
onUnload(() => {
  const options: CameraOptions = { cameraId }
  Camera.destroyCamera(options)
})
</script>
```

组件 ready 仅表示已挂载，不自动请求权限或启动镜头；需要先等待 ready，再由用户操作启动。cameraId 在一个组件生命周期内固定，不通过响应式改 ID 复用组件。公开 API 必须从模块根目录导入。演示位于 `example/uniappx/camera-demo.uvue`，没有宿主日志组件依赖，也没有自动拍摄流程。叠加 UI 由宿主布局实现，不内置快门样式。

## 演示页：从待启动到真实结果

1.0.1 的默认页面使用奶油色引导占位，提示镜头尚未启动；不会自动请求权限、开启相机或展示预置照片。点击“授权并启动后摄”后，状态读取真实 CameraX OPEN 与 PreviewView STREAMING，再显示 LIVE 标记。准备好无隐私画面后点击“拍摄照片”，页面使用本次实际输出的 JPEG 路径展示结果卡，附文件实际宽高与 SHA256 摘要，并等待 image 的真实 load 事件；未成功加载不会显示“实拍照片已显示”。JPEG 仍按 EXIF 方向处理，显示效果需按目标设备验收。

点击“定格取景”会调用 grabCameraFrame 生成当前实际 PNG，再暂停镜头、卸载原生取景组件，并在原预览区域绑定 image，明确标注“实机取景抓帧 · 非实时”。该图是本次预览分辨率的抓帧，不是实时流或传感器原始照片；“返回实时”需用户明确操作，重新挂载组件后按保存的模式、镜头方向与拍摄模板启动取景。这样在页面截图接口不能包含原生 TextureView 时，仍可展示已经真实生成并加载的抓帧；不能以空闲默认页或黑色 native-view 代替拍摄效果。清理缓存会同时清空相应结果卡，重要文件应先导出。1.0.1 的界面加载与补拍截图由本次设备回归单独记录，不复用下述 1.0.0 的验收通过数。

## 公开 API

createCameraId() 同步生成 UUID 镜头 ID；除其与 mountCameraView（使用 CameraMountOptions）外，其余函数使用同一个具名 CameraOptions，所有调用须填写 cameraId。回调统一 `{ code, message, data }`；success 或 fail 之一与 complete 各至多一次，在主线程投递，业务回调抛异常不会变成第二次 API 失败。录制的 startCameraRecording 特别在最终文件与证据就绪后才 success，开始时监听组件 recordstart。

| API | 参数 / 结果 |
| --- | --- |
| requestCameraPermissions | 可选 audio；默认只请求 CAMERA，audio=true 另请求 RECORD_AUDIO |
| startCamera / resumeCamera | mode=PHOTO/VIDEO、facing=back/front、可选 template；绑定完成返回，actual OPEN/STREAMING 由 statechange/getCameraState 确认 |
| pauseCamera / stopCamera | 取消未完成启动/拍照/帧输出；仅解绑自己的用例。录像先 stop 等 Finalize 与输出终结后再解绑/回调；恢复需显式 resume |
| destroyCamera | 幂等释放已挂载会话；终结录像并删除未交付输出，卸载组件同样清理。不自动删除已经交付的产物 |
| setCameraMode | mode 和可选 template；录像、证据提交、启动处理中返回失败，不中断后假成功 |
| switchCamera | facing 明确指定 front/back；不会自行反转；可能返回设备缺少该镜头 |
| setCameraZoom | zoomRatio，必须在设备 minZoomRatio/maxZoomRatio 范围内 |
| focusCamera | x/y 都在 [0,1]，按可见 PreviewView 坐标生成测光点；返回 focusSuccessful，设备可不支持 |
| setCameraTorch | on；无补光灯返回失败 |
| takeCameraPhoto | PHOTO 模式，真实 JPEG；返回路径、尺寸、EXIF orientation、SHA 与侧车路径 |
| startCameraRecording | VIDEO 模式，audio 默认 false；有声需预先单独授权。最终成功返回真实 MP4 路径、时长/尺寸/旋转/hasAudio、SHA 与侧车 |
| stopCameraRecording | 仅有效录制可调用；等待同一 Finalize 与证据，返回与录制终态相同产物。无录制/已终结返回失败 |
| grabCameraFrame | 仅实际 STREAMING 时取得 PreviewView.COMPATIBLE bitmap，真实 PNG，返回实际预览尺寸与 SHA 侧车 |
| readCameraPixel | x/y 在 [0,1]，左上(0,0)、右下(1,1)，映射 floor(x*(width-1))；返回 RGB/alpha/#RRGGBB 与实际像素坐标 |
| getCameraState | bound/paused、mode/facing、cameraState、previewState、recording/finishing/busy、generation、模板、缩放范围与 hasFlash |
| clearCameraOutputs | 仅此 cameraId 空闲时清理其缓存文件；先自行导出重要产物，无确认弹窗 |

组件事件：ready、statechange（实际状态）、recordstart、recordcomplete（完整终态 envelope）、error（挂载错误）。组件 ref 使用框架 `ComponentPublicInstance` / `$callMethod`；主要业务建议直接按 cameraId 调公开 API。defineExpose 提供 start(options)、pause/resume/stop/dispose。

## 拍摄模板

`CameraTemplate` 可选字段如下，未知字段、错误类型、小数整数参数、超界值均拒绝，不静默扩大限制。JSON null 使用默认/继承值。

| 字段 | 默认与边界 |
| --- | --- |
| aspect | 4:3；仅 4:3 / 16:9；照片绑定 ViewPort 裁剪，录像传递 Recorder 请求比例，实际尺寸以文件 metadata 为准 |
| jpegQuality | 90；整数 1–100，JPEG 编码质量，并非尺寸 |
| videoQuality | HD；仅 SD/HD/FHD/UHD，设备不支持精确档位即失败，无静默降级 |
| maxDurationMs | 10000；整数 1000–60000，真实录像到限触发 CameraX Finalize |
| maxOutputBytes | 20971520；整数 1048576–134217728，录像设置文件限制；所有输出提交前再次检查真实字节数 |

PHOTO 只绑定 Preview+ImageCapture；VIDEO 只绑定 Preview+VideoCapture，不组合四个 UseCase。不声称固定输出像素尺寸、精确帧率、视频裁切后处理或传感器原始数据。到达时长/文件限制的 CameraX Finalize 视为预期停止，仍须真实 MP4 可读、非空且不超过字节限制，stopReason 返回原生终态码。其他终态错误删除输出并 fail。

## 图像方向与证据边界

预览帧和取色来自屏幕上 PreviewView 的实际 bitmap，包含其显示旋转、裁剪与前摄镜像；分辨率是预览控件像素，不是传感器全分辨率。JPEG 可能用 EXIF 标记方向，读取 exifOrientation 正确显示；JPEG/MP4 不额外做前摄镜像，视频实际旋转返回 metadata.rotation。像素颜色来自预览图像处理结果，不作传感器/色卡的校准色值。

每份成功输出写应用私有随机文件，同时提交 `.evidence.json`（临时 part→rename）。包括输出真实字节数/SHA256、类型、时间、请求模板与实际媒体 metadata；返回 evidencePath。SHA 只证明与该文件字节的一致性，不是签名、时间戳公证或内容真实性证明。不上传、不写公共相册、不覆盖调用方文件。缓存文件可被系统回收，需业务自行复制到持久业务目录。

最多四个挂载视图；后台输出单工作线程、等待队列 4。整个插件缓存设 512MiB / 128文件保守预留（每个待输出预留模板字节上限、2文件与64KiB侧车预算，实际文件和预留可重复计入而提前拒绝）。此为插件的保守预留/最终提交限制，不是操作系统硬磁盘配额；CameraX 写入过程中仍可能出现短暂额外磁盘占用。超限明确失败，不自动删除已交付图片。单次预览 bitmap 上限 8MP、边长4096；超限拒绝，不强行申请大图。CameraX 的设备端编码/内存仍受硬件资源约束，多预览并发可能不支持。

## 生命周期与验收

必须是已附着、可见、处于前台的组件才可启动/拍摄。Activity ON_STOP 自动停止自己的录制并释放自己的用例；返回页面不会自动恢复。卸载/销毁后旧代际回调不再交付照片/预览帧；未交付文件会清理。录像暂停/停止时先完成 Finalize，销毁时取消未交付产物；从不调用 unbindAll。控件命令异步完成时校验代际。

错误码：9071001 入参/状态/忙碌，9071002 权限桥，9071003 绑定/控制失败，9071004 工作队列（部分路径以9071006返回输出失败），9071005 取消，9071006 输出/录像失败。请以 code!=0 判失败并展示 message，不把挂载或绑定成功当作真实拍摄成功。

### 1.0.1 演示更新与实拍（2026-11-07）

修复默认取景区只显示黑框、截图中原生预览遮住标题的问题：未启动时显示奶油色引导；拍照后显示本次真实 JPEG；定格取景显示本次实际 PNG，并明确标记为非实时。定格后卸载原生取景组件，返回实时会重新挂载。补充尚未就绪时暂停/停止的取消处理，以及录像失败结果的界面提示。相机 Native 与公开 API 未变。

本机补拍的 6 项检查通过，实际 JPEG 2448×1836、PNG 981×792 已独立读取、解码，并核对字节、SHA256与证据侧车一致。公开展示图拍摄自无隐私的实物，不是预置照片。另一次带只读诊断的真实按钮流程 12 项检查通过：后摄拍照、定格卸载、重新挂载取景、第二次拍照与停止清理；两次实际输出的拍摄模板五字段一致，21次状态查询回调终态计数与主线程标记通过。诊断只覆盖本机本轮，不能替代全部启动时序的稳定性验证。

早期自动驱动曾在页面就绪前触发启动而未达到 OPEN；该次失败保留在验收记录，未计通过。极早启动、连续快速重挂、其他设备与长期稳定性仍需后续验证。首版的前摄、有声录像与极限场景未验收范围继续保留。

### 1.0.0 首次验收记录（2026-11-06）

Android 14 / Redmi 22101317C，HBuilderX 5.34、uni-app x：23条相机原生核心检查通过；公开UTS驱动24条后摄操作断言通过，28次被跟踪API调用逐一确认success/fail互斥、complete一次且调用/回调均在主线程。范围包含PHOTO/VIDEO实际OPEN+STREAMING、JPEG、预览PNG、取色、1/2倍缩放、中心对焦控制、补光开关、录像期间模式切换拒绝、静音录像Finalize、暂停/恢复与销毁API状态。挂载事件不计入28次API回调数。

照片2448×1836、实际控件预览帧981×880、H.264 MP4 720×406约2.63秒（计时在真实recordstart后约3秒发起停止），视频无音轨。三份真实产物已从应用私有目录独立读回，解码、真实字节大小、SHA256与证据侧车均一致；分辨率和时长只代表本机本次样本。1.0.0 首次发布的演示截图是未启动镜头的真实默认状态，不是录像画面；1.0.1 已更新真实结果展示并完成单独实拍。

暂停/停止验证了当前会话解绑命令和引用状态；state.cameraState在无引用时为CLOSED，不据此宣称独立观察到了硬件关闭事件。未测试前摄产物、有声录制、全部质量档位、60秒/存储极限、多视图并发和长期资源稳定性；其他机型/系统与普通uni-app未验收。对焦返回值按设备实际结果读取，不保证所有场景对焦命中。测试前由使用者准备无隐私画面，再显式授权与拍摄。

官方依据：[CameraX 录像架构](https://developer.android.com/media/camera/camerax/video-capture)、[PreviewView API](https://developer.android.com/reference/androidx/camera/view/PreviewView)、[UTS 插件](https://doc.dcloud.net.cn/uni-app-x/plugin/uts-plugin.html)。CameraX 使用 Apache 2.0 开源许可。
