# Nexus Plugin Atlas

Nexus Wang 的 uni-app 插件公开文档集合与画廊。

在线查看：[插件集合与真实演示画廊](https://awak3n1ngone.github.io/nexus-uniapp-plugins/)

本次收录 25 个插件入口、23 篇说明、22 款实机画面、26 张真实截图。

- 搜索与分类筛选、封面/Android实机图切换、完整README阅读、市场外链。
- 新开发未上架、已发布旧版本与本轮升级分别标注。没有用本地版本冒充已发布版本。
- 仅包含公开说明、封面及审核过的展示截图，不包含收费插件源码、APK或密钥。
- 默认/待授权截图说明页面真实显示，不等于所有功能已经验收。外设、平台限制请读每款README。

## 本地查看

在本目录运行 `python3 -m http.server 18768`，浏览器打开 `http://127.0.0.1:18768`。使用HTTP而不是file协议，以便加载catalog.json。无npm安装或构建依赖，不加载外部字体或CDN脚本。

## 更新

导出脚本仅在作者本地有原工程时运行：

```sh
python3 build-catalog.py --project '/path/to/uniapp-project' --outputs '/path/to/public-outputs' --github 'https://github.com/OWNER/REPO'
```

仅复制明确的readme.md、cover.png和展示截图白名单，不复制utssdk目录。脚本支持`--overrides`指定最终发布/测试状态JSON；构建后请重新浏览核对。源工程路径由--project显式传入，仅用于本地导出；GitHub Actions不会读取本地工程。

## GitHub Pages

仓库提供Pages部署workflow；仓库Settings → Pages的Source选择GitHub Actions后，推送main自动发布静态页面。GitHub Pages地址和发布状态以实际部署为准。

## 内容与安全

README使用DOM节点安全渲染：不解析原始HTML、不使用innerHTML、不执行文档脚本。仅允许http(s)/mailto与本站明确的文档资源链接；下载的说明Markdown仍是文本。插件版本与实际购买价请核对各自官方市场页。

作者：Nexus Wang。展示文档不改变各插件的商业授权条件。
