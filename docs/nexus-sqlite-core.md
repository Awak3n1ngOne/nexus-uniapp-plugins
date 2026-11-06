# Nexus 本地数据库与离线队列

<!-- NEXUS:WAVE10:VERIFICATION:START -->
## 本轮验收记录（2026-11-06）

本插件属于本轮2款新增、8款升级的交付。整批10项已在同一台Android14手机的统一Native复验APK中完成：数据38条、工业扫码/标签28条、文档图像15条、媒体26条，合计107条全部通过，0失败、0跳过；公开UTS新增链路另有30条真实回归通过。**这些是整批不同层次的检查数，不是本插件107个功能，也不能相加称为137个独立功能。** 本插件只对应其中相关检查，测试不替代全功能、全机型或长期稳定性验收。

新增能力以Android uni-app x为本轮验证范围；普通uni-app及旧平台支持见各API说明。iOS/Harmony/Web不因本轮Android测试获得新增支持声明。实体PDA、DPM工件、BLE外设与纸张输出、完整Office排版、系统选择器所有跨UID/授权回收路径均不在本轮通过范围内。

本轮新增截图为数据库、文件工作流和工业扫码业务页的真实whole-page页面快照，已人工查看；它们不含系统栏，也不证明相机现场ROI或其他插件所有按钮均已人工验收。
<!-- NEXUS:WAVE10:VERIFICATION:END -->


作者：**Nexus Wang** · 插件ID：`nexus-sqlite-core` · 版本：1.0.0

让工业采集、盘点、工单在离线时先可靠落地。基于 Android 自带 SQLite，实现参数SQL、版本迁移、原子批处理和持久 Outbox。数据保留在宿主私有目录，不自动联网，不采集或上传业务内容。

**支持：Android uni-app x，最低 API 23。** 本轮未提供 iOS、Harmony、Web、小程序和普通uni-app适配；不以其他插件的测试替代本插件验收。HBuilderX建议5.07及以上；具体构建与真机结果以交付验收报告为准。

## 两个业务能力

1. **业务数据与Outbox一起提交。** `executeBatch`可在同一SQLite事务里保存工单和持久事件。SQL或事件冲突时整体回滚，不出现“订单成功、队列丢失”的半提交。
2. **带租约令牌的离线发送队列。** 领取事件后获得令牌和截止时间；确认、重试均核验令牌。重开数据库后事件状态仍在，超时租约可重新领取。`eventId`内容不一致会冲突，已确认记录保留以维持本地幂等。

## 安装与演示

将本包放入工程 `uni_modules/`。示例：`example/uniappx/sqlite-demo.uvue`，注册为页面后运行到Android。示例仅创建 `nexus_demo / demo-account` 演示数据库，不接入真实订单或网络。

```ts
import * as Database from '@/uni_modules/nexus-sqlite-core'
import { NexusSqliteOptions } from '@/uni_modules/nexus-sqlite-core'

const request = JSON.parseObject('{"name":"orders","scope":"account-A/site-1","version":1,"migrations":[{"version":1,"statements":[{"sql":"CREATE TABLE orders(id TEXT PRIMARY KEY, quantity INTEGER NOT NULL)"}]}]}')!
const options: NexusSqliteOptions = {
  request: request,
  success: (res: UTSJSONObject): void => {
    console.log(JSON.stringify(res))
    // res.data.databaseId 用于后续调用
  },
  fail: (err: UTSJSONObject): void => { console.log(JSON.stringify(err)) }
}
Database.openDatabase(options)
```

所有函数参数均为同一个真实导出类型 `NexusSqliteOptions`：

```ts
export type NexusSqliteOptions = {
  request: UTSJSONObject
  success?: (res: UTSJSONObject) => void
  fail?: (err: UTSJSONObject) => void
  complete?: (res: UTSJSONObject) => void
}
```

成功返回 `{code:0,message:'ok',data:{...}}`；失败返回 `{code:9121xxx,message:'...'}`，随后调用`complete`。原生操作串行在工作线程执行，回调回主线程；回调异常不会在工作线程再次发送失败。原生异常只返回类别，不把SQL内容写进日志。

## API与请求

| 函数 | request字段 | data |
| --- | --- | --- |
| `openDatabase` | `name`：1–64字母/数字/下划线/横线；`scope`：1–256字符，明确账号/业务空间；可选`version`,`migrations` | `databaseId`,`version`,`reused` |
| `closeDatabase` | `databaseId` | `closed` |
| `queryDatabase` | `databaseId`,`sql`：单条SELECT；可选`args`、`maxRows`（默认1000，1–10000） | `columns`,`rows`,`truncated` |
| `executeBatch` | `databaseId`,`statements`：1–256个`{sql,args?}`；可选`event` | `results`及`event` |
| `migrateDatabase` | `databaseId`,`version`,`migrations` | `fromVersion`,`version` |
| `enqueueEvent` | `databaseId`,`eventId`,`topic`,`payload` | `eventId`,`deduplicated` |
| `claimEvents` | `databaseId`；可选`limit`（默认20，1–200）、`leaseMs`（默认30000，1000–3600000） | `events`数组 |
| `acknowledgeEvent` | `databaseId`,`eventId`,`leaseToken` | `eventId`,`state:'acked'` |
| `retryEvent` | 同上；可选`delayMs`（默认1000，0–86400000） | `eventId`,`state:'pending'` |
| `getOutbox` | `databaseId`；可选`maxRows` | `columns`,`rows`,`truncated`，不默认返回业务payload |
| `getSqliteCapabilities` | `{}` | 平台、事务/租约支持，`encrypted:false`,`networkSync:false` |

`args`只接受null、boolean、number、string。写语句使用SQLite绑定，boolean转0/1。查询返回SQLite原生数字、字符串和null；BLOB返回`{base64:'...'}`。列名相同的SELECT请使用AS别名，否则JSON对象会覆盖同名列。

写SQL仅支持INSERT/UPDATE/DELETE/REPLACE/CREATE/DROP/ALTER开头的单条语句；不接收ATTACH、PRAGMA、事务控制或触发器多语句。`nexus_outbox`和`nexus_migration_history`是内部保留表，不允许在写SQL直接引用。SQL接口供可信宿主调用，并非运行不可信SQL的沙箱。不要拼接用户输入；将其放进`args`。

### 迁移

```json
{
  "databaseId": "openDatabase返回值",
  "version": 2,
  "migrations": [
    { "version": 2, "statements": [
      { "sql": "ALTER TABLE orders ADD COLUMN batch TEXT" }
    ] }
  ]
}
```

版本按整数连续提升，不允许降级或重复迁移版本。未提供已完成版本的脚本不会重复执行；缺少下一版脚本或SQL失败时回滚本次所有迁移与版本号。生产发布前请在备份副本验证迁移；本插件不自动备份或替业务决定数据恢复。

### 工单与事件原子提交

```json
{
  "databaseId": "openDatabase返回值",
  "statements": [
    { "sql": "INSERT INTO orders(id,quantity) VALUES(?,?)", "args": ["000001",2] }
  ],
  "event": { "eventId":"account-A:order-000001:v1", "topic":"order.saved", "payload":"{\"id\":\"000001\",\"quantity\":2}" }
}
```

`payload`是字符串，最多1MiB。`topic`为1–128字符；`eventId`为1–128个字母/数字/`_.:-`，由业务生成稳定值。重复同一ID及完全相同内容会返回`deduplicated:true`；不同内容明确冲突。**重复提交相同事件不会自动阻止你的SQL再次执行**：例如`qty=qty+1`仍可能重复加一；业务SQL也须使用唯一业务键、INSERT冲突策略或幂等更新，不能只依赖事件去重。

### 发送队列

1. `claimEvents`返回`eventId/topic/payload/attempts/leaseToken/leaseUntil`。
2. 宿主发请求时将`eventId`作为服务端幂等键。服务器按账号/工单规则去重。
3. 收到业务成功响应后，携带当前`leaseToken`调用`acknowledgeEvent`。
4. 临时失败使用`retryEvent`，过期或错误令牌会拒绝。若应用崩溃，租约到期后可重新领取。

本插件不发送HTTP、不后台常驻、不保证网络exactly-once。租约使用设备墙钟时间，设备时间跳变会影响到期判断；只是一台设备数据库中的发送协调。不要在当前账号退出后把旧scope队列发到新账号。

## 错误码

| code | 含义 |
| --- | --- |
| 9121001 | 参数/SQL类型/范围/迁移无效 |
| 9121002 | SQLite原生操作失败 |
| 9121003 | 数据库未打开 |
| 9121004 | eventId内容冲突 |
| 9121005 | 租约过期、已确认或令牌不匹配 |
| 9121006 | 宿主Context不可用 |

## 数据、许可与限制

- 文件名由name与scope的SHA256派生，位于宿主`files/nexus-sqlite`；哈希不是加密。数据库未加密，受宿主私有目录与系统备份配置约束。业务需要整库加密时应另行选择经过许可核验的实现。
- `closeDatabase`只关闭连接，不删除业务数据。默认不清除已确认事件；长期使用应按业务归档策略评估存储增长。
- 只有参数绑定可以抵御值输入注入；SQL结构仍由宿主负责。查询限制行数，不是大BLOB/复杂SQL的资源沙箱。
- scope和databaseId是数据路由，不替宿主做账号认证。不要把任意SQL入口或其他账号scope直接暴露给不可信网页。
- `databaseId`是进程内已打开库的标识，进程重启后须用相同name/scope重新open。
- 无第三方运行时依赖，使用[Android SQLiteDatabase](https://developer.android.com/reference/android/database/sqlite/SQLiteDatabase)。
- 目标普通授权¥29.90、源码授权¥299；是否已上架及实际购买价格以市场按钮为准，免费试用是平台独立入口。

验收应覆盖真实Android SQLite落盘/关闭重开、迁移失败回滚、业务与Outbox原子回滚、租约冲突及账号scope隔离。仅编译成功不等于所有Android机型长期稳定性或服务端业务幂等已验收。
