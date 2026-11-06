# Nexus 文件选择与附件工作流

<!-- NEXUS:WAVE10:VERIFICATION:START -->
## 1.0.0历史验收记录（2026-11-06）

本插件1.0.0属于此前2款新增、8款升级的交付；以下107/30是该历史批次记录，不是1.1.0系统选择器的新增验收。整批10项已在同一台Android14手机的统一Native复验APK中完成：数据38条、工业扫码/标签28条、文档图像15条、媒体26条，合计107条全部通过，0失败、0跳过；公开UTS新增链路另有30条真实回归通过。**这些是整批不同层次的检查数，不是本插件107个功能，也不能相加称为137个独立功能。** 本插件只对应其中相关检查，测试不替代全功能、全机型或长期稳定性验收。

新增能力以Android uni-app x为本轮验证范围；普通uni-app及旧平台支持见各API说明。iOS/Harmony/Web不因本轮Android测试获得新增支持声明。实体PDA、DPM工件、BLE外设与纸张输出、完整Office排版、系统选择器所有跨UID/授权回收路径均不在本轮通过范围内。

本轮新增截图为数据库、文件工作流和工业扫码业务页的真实whole-page页面快照，已人工查看；它们不含系统栏，也不证明相机现场ROI或其他插件所有按钮均已人工验收。
<!-- NEXUS:WAVE10:VERIFICATION:END -->


作者：**Nexus Wang** · 插件ID：`nexus-file-workflow` · 版本：1.1.0

面向工业工单、盘点证据与文档交接：1.1新增真实Android系统文件选择器，单选/多选、MIME过滤及明确的URI读授权管理，衔接原有有界导入、SHA256与不可变附件版本链。只处理用户明确选择或宿主明确传入的文档，不扫描未选择的私人文件，不自动联网。

**支持：Android uni-app x，最低API 23。** 本轮未提供iOS、Harmony、Web、小程序和普通uni-app适配。HBuilderX建议5.07及以上；构建与真机结果以交付验收报告为准。

## 1.1新增：系统文件选择

使用Android `ACTION_OPEN_DOCUMENT`＋`CATEGORY_OPENABLE`，只请求读授权；不请求写授权、`MANAGE_EXTERNAL_STORAGE`、广泛存储或媒体读取权限。系统提供方可包含本地与云端文档，实际提供方和设备策略以系统选择界面为准。

```ts
import * as Files from '@/uni_modules/nexus-file-workflow'
import { NexusChooseFilesOptions } from '@/uni_modules/nexus-file-workflow'

const options: NexusChooseFilesOptions = {
  mimeTypes: ['text/plain', 'application/pdf'],
  multiple: true,
  maxCount: 3,
  maxBytes: 8388608,
  persistRead: false,
  timeoutMs: 180000,
  success: (result: UTSJSONObject): void => {
    const items = result.getJSON('data')?.getArray<UTSJSONObject>('items')
    // item.uri 是content://，不是可猜测的磁盘绝对路径。
    // 若需长期可靠使用，应明确导入私有工作区，或验证持久读授权结果。
    console.log('selected count=' + (items?.length ?? 0).toString())
  },
  fail: (result: UTSJSONObject): void => {
    console.log(result.getNumber('code'), result.getString('message'))
  }
}
Files.chooseSystemFiles(options)
```

### 新增API与具名类型

以下类型均从插件根目录真实导出，可直接在uni-app x中import，不需要导入utssdk内部路径。

| API | Options类型 | 语义 |
| --- | --- | --- |
| `chooseSystemFiles` | `NexusChooseFilesOptions` | 打开系统文档选择界面，收到可读文档结果后成功；取消和异常走fail |
| `cancelSystemFilePicker` | `NexusCancelFilePickerOptions` | 结束指定/当前插件请求的逻辑等待，不关闭外部系统界面 |
| `getSystemFilePickerState` | `NexusFilePickerStateOptions` | 返回本插件busy/phase/requestId/requestCode |
| `getPersistedFileGrants` | `NexusPersistedGrantOptions` | 只列本插件明确选择并登记的URI，与宿主全局URI授权列表区分 |
| `releasePersistedFileGrant` | `NexusPersistedGrantOptions` | 仅在本插件取得且代际匹配时释放读授权；其他授权只解除自身登记 |

所有新Options都展开`success?/fail?/complete?`，回调数据为`UTSJSONObject`。每个终态只投递一次到主线程；success或fail后会调用complete，消费方回调异常不会被改报成第二次失败。

`NexusChooseFilesOptions`字段：

| 字段 | 默认值与限制 |
| --- | --- |
| `mimeTypes?:string[]` | 默认`['*/*']`，1–16个有效MIME模式；type/subtype各最多127字符且以字母数字开头，拒绝`../txt`等无效名称；支持`image/*`、`*/*`等。多个类型使用EXTRA_MIME_TYPES |
| `multiple?:boolean` | 默认false |
| `maxCount?:number` | 单选必须为1；多选默认9，允许1–20整数。返回ClipData与data URI按系统返回顺序去重；超过数量明确失败，不静默截断。最多处理100个原始候选 |
| `maxBytes?:number` | 默认16MiB，1字节–100MiB整数。**选择阶段仅按提供方已知元数据大小初筛，不是全流读取保证。** 另做一次1字节可读性探测；大小未知返回null，虚报或未知长度必须在后续importWorkspaceFile中按实际流式字节再限制 |
| `persistRead?:boolean` | 默认false；true时也只按实际READ＋PERSISTABLE返回flags及系统take结果决定，不把请求成功当永久授权 |
| `timeoutMs?:number` | 默认180000，5000–600000整数；包含结果处理等待。超时走fail，不能据此声称系统DocumentsUI已被关闭 |
| `localOnly?:boolean` | 默认false；true请求系统仅显示本地文档，实际提供方由系统实现 |

`NexusCancelFilePickerOptions`额外字段`requestId?:string`；省略时针对本插件当前请求。多调用方或页面退出时建议先读取并保留自己请求ID，再指定ID取消，避免结束其他调用方之后启动的请求。请求不匹配/没有请求时成功返回`cancelled:false`和实际busy状态，不会伪造选择成功。

`NexusFilePickerStateOptions`只有回调字段。`NexusPersistedGrantOptions`在释放时须提供`uri:string`，查询时无需uri。

### 返回文档数据

成功data示例：

```json
{
  "items": [{
    "uri": "content://用户明确选择的提供方/document/id",
    "name": "测试工单.pdf",
    "nameTruncated": false,
    "mimeType": "application/pdf",
    "size": null,
    "sizeKnown": false,
    "readable": true,
    "persistedRead": false,
    "grantOwned": false,
    "preexistingHostGrant": false,
    "persistenceStatus": "not_requested"
  }],
  "count": 1,
  "multiple": false,
  "persistReadRequested": false,
  "metadataSizeOnly": true
}
```

- name去掉控制字符、最多256个Unicode码点；原始名称仅作为显示文本，不拿来拼接输出路径。
- URI只接受content协议，不转猜测的“真实路径”。MIME按实际提供方getType再校验；指定过滤器下未知类型也会明确失败。
- size未知是null，零字节是0，二者不同。readable仅表示已成功打开并探测流，不保证后续云端传输不会中断。
- persistenceStatus可能为not_requested、not_offered、provider_denied、provider_unsupported、preexisting_host_grant、already_owned、acquired或not_acquired。应以persistedRead实际布尔值判断是否已持久化。

### 授权生命周期与取消边界

本插件只登记用户经本插件明确选择并取得/已有的持久读URI，不把宿主其他插件的授权全量列出来。首次持久化前检查宿主是否已持有读授权：已有的标记为preexisting，`releasePersistedFileGrant`只解除本插件登记，不撤销它。

本插件新取得的授权记录实际`persistedTime`代际。再次选择本插件同代际owned URI仍识别为自有；宿主/系统外部撤回再取得或其他功能再次take导致代际变化时，不把旧owned布尔值当当前所有权。释放仅请求READ，绝不顺便释放WRITE。

Android URI授权仍是**同一宿主UID共享**的资源。登记和代际比较不能证明其他消费者没有使用同一授权；宿主应协调共享URI的保留/释放、多账号可见性和退出策略，不能把本插件登记当账号认证或系统级私有权限沙箱。用户撤回、提供方删除文档或系统清理后，旧URI仍可能失效。

每次请求使用单独UUID和本进程不复用的requestCode，精确处理相同请求号，终态只移除自己的结果/销毁回调。**宿主应预留53001–65000范围给本插件，其他插件不要使用此号段**；本插件不能控制任意宿主主动复用同一requestCode。达到本进程分配上限后明确失败，不回绕复用。

取消、超时、宿主销毁后不会再把迟到结果报成成功；当前请求新增的持久授权按requestToken与persistedTime逐URI回滚，保留原有及其他请求的登记。已进入提供方I/O时，取消信号与清理可能稍后完成；不会承诺强制终止任意第三方Provider。逻辑取消不主动关闭外部DocumentsUI，调用方应等系统界面退出后再开启下一次选择。

### 系统选择 → 有界导入 → 附件版本

示例页依次提供这三个真实操作：

1. 用户通过系统界面明确选择，读取返回首个item.uri。
2. 将该URI放入原有`importWorkspaceFile`的sourceUri，并使用独立files/生成路径、maxBytes和可选expectedSha256；实际逐字节校验后提交目的文件。
3. 将导入结果的私有相对path交给`commitAttachmentRevision`，明确attachmentId与expectedVersion。版本冲突先刷新，不自动覆盖。

多选仅表示一次返回多个授权URI，不自动导入所有文件，也不自动请求网络上传。选择后可直接用原有sourceUri接口导入或提交附件；本插件不把元数据探测当字节哈希验证。

### 系统选择错误码

| code | 含义 |
| --- | --- |
| 9122101 | MIME、数量、大小、超时或其他参数范围无效 |
| 9122102 | 本插件已有pending选择，或重复启动同一预留请求 |
| 9122103 | Activity/应用Context不可用、宿主不在前台 |
| 9122104 | 系统文档选择器启动/监听登记失败 |
| 9122105 | 用户/调用方取消，或处理时请求已失效 |
| 9122106 | 系统返回非成功码、空结果或没有URI |
| 9122107 | 非content URI或实际MIME不符 |
| 9122108 | 超过maxCount或原始候选上限 |
| 9122109 | 提供方已知元数据大小超过maxBytes |
| 9122110 | Provider读取、JSON解析或工作线程异常 |
| 9122111 | 请求超时 |
| 9122112 | 宿主Activity销毁 |
| 9122113 | 本进程requestCode分配范围耗尽 |
| 9122114 | 授权登记/释放失败，或URI未在本插件登记 |

### 1.1系统选择器验收状态

本版新增42条产品核心/provider检查已在Android真机全部通过，0失败、0跳过；同次统一Native APK另有相机23条、夹具自身13条，合计78/78。42条只计本插件新核心检查，另两组不当作本插件功能数。UTS静态预检通过；公开UTS与系统DocumentsUI选择由本轮集成验收另行记录。42条包含同UID真实Provider及路由/边界，不冒充系统界面选择或跨UID持久授权成功。上方1.0批次107/30不得计作本版新增系统选择器的通过数量。

官方资料：[Android SAF](https://developer.android.com/training/data-storage/shared/documents-files)、[UTSAndroid结果及销毁监听](https://doc.dcloud.net.cn/uni-app-x/uts/utsandroid.html)。

## 两个业务能力

1. **文件交接可校验。** 流式拷贝时计算SHA256、限制最大字节；完整输入与期望哈希一致后，才在同一私有目录提交目的文件。失败不留下可被误认为完成的目标文件，不覆盖现有文件。
2. **附件替换有版本。** 调用方提交`expectedVersion`；旧版本提交会被明确拒绝。每一新版本是独立文件，记录哈希、大小、时间、备注，保留既有版本。元数据在SQLite事务里提交。

这不是通用上传器：没有网络分片续传、后台上传、审批账号系统或服务端签章。版本链可作为审批系统的输入，不把本地版本检查冒充“已获审批”。

## 安装与演示

本包置于`uni_modules/`。示例`example/uniappx/files-demo.uvue`提供真实系统单/多选、持久读授权开关、选择取消、有界导入、附件版本与授权登记管理。仅在点击后打开系统界面；导入/版本仅写`nexus-picker-demo`私有工作区，默认不保留持久权限。

新版新增五个具名UTS入口，旧`NexusFileOptions`和九个API保留兼容。以下先说明新增系统选择；原有文件API在后文。

```ts
import * as Files from '@/uni_modules/nexus-file-workflow'
import { NexusFileOptions } from '@/uni_modules/nexus-file-workflow'

const request = new UTSJSONObject()
request['scope'] = 'account-A/order-0001'
request['path'] = 'files/checklist.txt'
request['text'] = '本轮工单附件'
const options: NexusFileOptions = {
  request: request,
  success: (res: UTSJSONObject): void => { console.log(JSON.stringify(res)) },
  fail: (err: UTSJSONObject): void => { console.log(JSON.stringify(err)) }
}
Files.writeWorkspaceText(options)
```

原有九个私有文件/附件函数仍使用同一个真实导出类型：

```ts
export type NexusFileOptions = {
  request: UTSJSONObject
  success?: (res: UTSJSONObject) => void
  fail?: (err: UTSJSONObject) => void
  complete?: (res: UTSJSONObject) => void
}
```

成功返回`{code:0,message:'ok',data:{...}}`；失败返回`{code:9122xxx,message:'...'}`，随后调用`complete`。工作线程串行处理，回调回主线程。

## 原有文件与附件API

除能力查询外，所有request须有`scope`（1–256字符），建议包含账号、工单和业务版本。scope使用SHA256派生目录名，**不是加密**。

| 函数 | request字段 | data |
| --- | --- | --- |
| `openWorkspace` | `scope` | `workspaceId`,`private:true` |
| `writeWorkspaceText` | `scope`,`path`：`files/`下新文件，`text` | `path`,`bytes`,`sha256` |
| `readWorkspaceText` | `scope`,`path` | `text`,`file`元数据 |
| `inspectWorkspaceFile` | `scope`,`path` | `path`,`bytes`,`sha256` |
| `importWorkspaceFile` | `scope`,`path`：`files/`下新文件；`sourcePath`或`sourceUri`；可选`maxBytes`,`expectedSha256` | `path`,`bytes`,`sha256` |
| `exportWorkspaceFile` | 同上，但目标`path`必须在`exports/` | `path`,`bytes`,`sha256` |
| `commitAttachmentRevision` | `scope`,`attachmentId`,`expectedVersion`、输入源；可选`note`,`maxBytes`,`expectedSha256` | `attachmentId`,`version`,`file` |
| `getAttachmentRevisions` | `scope`,`attachmentId` | `attachmentId`,`revisions`按版本升序 |
| `getFileWorkflowCapabilities` | `{}` | 支持项及`networkUpload:false`,`systemFilePicker:true`,`managedPersistedReadGrants:true` |

### 路径与输入源

- scope是逻辑分区，不是对同一宿主代码的安全沙箱；宿主仍须验证账号授权。绝对sourcePath入口允许宿主明确交接其files/cache中的文件，因此不能仅靠scope阻止可信宿主主动跨区复制。
- 工作区：宿主`files/nexus-files/<scope哈希>/`。相对路径只能在`files/`、`exports/`、`revisions/`三个子树。拒绝绝对输出路径、空段、`.`/`..`、反斜杠、NUL、冒号、点开头的段，以及canonical解析后越界的路径。
- 新文件不覆盖既有文件。相对路径总长最多256，每段最多120字符。
- `sourcePath`可以是工作区内相对文件；也可为**当前宿主**files/cache目录中的绝对文件。拒绝外部共享存储和系统路径直接读取。
- `sourceUri`只接受`content://`，使用宿主已经拥有的授权读取；`importWorkspaceFile`本身不会索取或持久化授权，也不绕过授权。新增`chooseSystemFiles`可在用户选择后按实际返回flags主动请求持久读授权。URI和sourcePath均提供时优先URI。
- 1.1提供`chooseSystemFiles`系统入口；也兼容宿主从其他合法选择器取得的URI。每次请求仅登记自己的UTS结果/销毁监听，并移除相同函数引用；不移除其他插件监听。
- `maxBytes`默认16MiB，允许1字节至100MiB。流式计数超限立即失败，即使URI元数据误报长度也以实际读取为准。零字节文件允许。
- `expectedSha256`可选；传入时须是64位十六进制并与实际字节匹配。这里检查字节一致性，不保证文件来源可信或内容合法。
- 文本写入最多4MiB；文本读取最多1MiB，UTF-8解码。二进制文件请使用inspect/import/export，不把它传给readText。

### 授权URI导入

```json
{
  "scope": "account-A/order-0001",
  "sourceUri": "content://调用方已授权的provider/文档",
  "path": "files/delivery-note.pdf",
  "maxBytes": 16777216,
  "expectedSha256": "可选64位SHA256"
}
```

不要把示例中的文字当实际URI；权限、用户选择与Provider可用性由宿主管理。读权限失效会返回文件操作失败，不偷偷改读其他路径。

### 不可变附件版本

```json
{
  "scope": "account-A/order-0001",
  "attachmentId": "delivery-note",
  "expectedVersion": 0,
  "sourcePath": "files/delivery-note.pdf",
  "note": "首次提交"
}
```

- `attachmentId`为1–128个字母/数字/`_.-`且不能点开头。
- 首次提交`expectedVersion:0`，返回`version:1`；下次必须传1。
- 版本冲突返回`9122007`，宿主先刷新版本链，再让业务明确是否替换，不盲目覆盖。
- `revisions`项包含`version/path/sha256/bytes/note/createdAt`。每版实际文件独立，通用写入/导入不能写到`revisions/`。只读路径可以用于后续导出。
- 文件先完整写入，随后事务登记；应用在文件提交后、元数据登记前崩溃，可能留下未登记的孤立文件。已登记记录不会指向尚未完成的临时输入。没有自动垃圾回收或跨进程一致性保证。
- 默认保留所有版本，不自动删除。宿主卸载/清数据会删除私有文件，业务须按自己的备份、保留期和权限策略管理。

### 私有导出

```json
{ "scope":"account-A/order-0001", "sourcePath":"files/delivery-note.pdf", "path":"exports/delivery-note-v1.pdf" }
```

导出仍在当前宿主私有目录，不等于写入公共下载目录或已分享给其他App。对外分享可使用宿主已有FileProvider/分享模块，明确授权目标后进行。

## 错误码

| code | 含义 |
| --- | --- |
| 9122001 | 参数、路径或类型不合法 |
| 9122002 | 原生I/O或元数据操作失败 |
| 9122003 | 输入/文件不存在或无法打开 |
| 9122004 | 目的文件已存在 |
| 9122005 | 实际输入字节超限 |
| 9122006 | SHA256不匹配 |
| 9122007 | 附件版本冲突 |
| 9122008 | 宿主Context不可用 |

## 验收与限制

应以真实Android检查完整UTF8/控制字节、SHA256、超限与错误哈希不留目标、越界路径拒绝、版本冲突与历史内容不变。已授权URI导入需另测实际Provider、授权回收和进程重启；内部测试Provider不等于所有系统选择器/跨UID权限验收。

使用Android平台文件、SQLite及[AtomicFile](https://developer.android.com/reference/android/util/AtomicFile)；无第三方运行时依赖。私有目录边界不等于内容加密；业务文件可能含敏感信息，宿主负责账号授权、系统备份和留存策略。插件本身不联网。

普通授权¥29.90、源码授权¥299（延续既有已生效定价）；实际版本与购买价以市场按钮为准，免费试用为平台独立入口。
