# Nexus 文件与附件工作流

作者：**Nexus Wang** · 插件ID：`nexus-file-workflow` · 版本：1.0.0

面向工业工单、盘点证据与文档交接的Android私有文件模块：已授权URI导入、限额拷贝、SHA256校验、私有导出，以及带乐观并发检查的不可变附件版本链。只处理调用方明确传入的文件，不扫描照片、通讯录或系统目录，不自动联网。

**支持：Android uni-app x，最低API 23。** 本轮未提供iOS、Harmony、Web、小程序和普通uni-app适配。HBuilderX建议5.07及以上；构建与真机结果以交付验收报告为准。

## 两个业务能力

1. **文件交接可校验。** 流式拷贝时计算SHA256、限制最大字节；完整输入与期望哈希一致后，才在同一私有目录提交目的文件。失败不留下可被误认为完成的目标文件，不覆盖现有文件。
2. **附件替换有版本。** 调用方提交`expectedVersion`；旧版本提交会被明确拒绝。每一新版本是独立文件，记录哈希、大小、时间、备注，保留既有版本。元数据在SQLite事务里提交。

这不是通用上传器：没有网络分片续传、后台上传、审批账号系统或服务端签章。版本链可作为审批系统的输入，不把本地版本检查冒充“已获审批”。

## 安装与演示

本包置于`uni_modules/`。示例`example/uniappx/files-demo.uvue`仅操作`demo-account`下自建文本，可查看哈希、提交版本和私有导出。

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

所有函数参数均为同一个真实导出类型：

```ts
export type NexusFileOptions = {
  request: UTSJSONObject
  success?: (res: UTSJSONObject) => void
  fail?: (err: UTSJSONObject) => void
  complete?: (res: UTSJSONObject) => void
}
```

成功返回`{code:0,message:'ok',data:{...}}`；失败返回`{code:9122xxx,message:'...'}`，随后调用`complete`。工作线程串行处理，回调回主线程。

## API

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
| `getFileWorkflowCapabilities` | `{}` | 支持项及`networkUpload:false`,`systemFilePicker:false` |

### 路径与输入源

- scope是逻辑分区，不是对同一宿主代码的安全沙箱；宿主仍须验证账号授权。绝对sourcePath入口允许宿主明确交接其files/cache中的文件，因此不能仅靠scope阻止可信宿主主动跨区复制。
- 工作区：宿主`files/nexus-files/<scope哈希>/`。相对路径只能在`files/`、`exports/`、`revisions/`三个子树。拒绝绝对输出路径、空段、`.`/`..`、反斜杠、NUL、冒号、点开头的段，以及canonical解析后越界的路径。
- 新文件不覆盖既有文件。相对路径总长最多256，每段最多120字符。
- `sourcePath`可以是工作区内相对文件；也可为**当前宿主**files/cache目录中的绝对文件。拒绝外部共享存储和系统路径直接读取。
- `sourceUri`只接受`content://`，使用宿主已经拥有的授权读取；不会主动索取权限，不会绕过授权，不帮宿主持久化URI权限。URI和sourcePath均提供时优先URI。
- 不内置系统选择器。宿主应先通过自己已集成的SAF/文件选择功能让用户明确选择，获得URI及有效授权，再调用本插件。避免抢占其他插件的Activity结果监听。
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

目标普通授权¥29.90、源码授权¥299；是否已上架及实际价格以市场购买按钮为准，免费试用为平台独立入口。
