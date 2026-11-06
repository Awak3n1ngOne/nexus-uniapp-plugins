#!/usr/bin/env python3
"""Export public plugin docs and presentation assets. Never copies plugin source code."""
from pathlib import Path
from datetime import datetime
import argparse, hashlib, json, re, shutil, html

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--project', type=Path, required=True)
parser.add_argument('--outputs', type=Path, default=HERE.parent)
parser.add_argument('--github', default='')
parser.add_argument('--overrides', type=Path)
args = parser.parse_args()
project = args.project.resolve(); output = args.outputs.resolve()
source = project / 'uni_modules'
if not source.is_dir(): parser.error('project/uni_modules is missing')
assets=HERE/'assets'; (assets/'covers').mkdir(parents=True,exist_ok=True);(assets/'screens').mkdir(parents=True,exist_ok=True);(HERE/'docs').mkdir(exist_ok=True)

def read_json(p, fallback):
    return json.loads(p.read_text()) if p.exists() else fallback

base_market = {x['id']:x for x in read_json(output.parent/'work/nexus-market-final.json',[])}
override_path=args.overrides or output.parent/'work/nexus-wave10/catalog-overrides.json'
overrides=read_json(override_path,{})
if 'plugins' in overrides: overrides=overrides['plugins']
category={
 'aiko-scan-pro':('工业与设备','SCAN','扫码、识别与盘点'), 'aiko-ble-core':('工业与设备','CONNECT','设备连接与标签打印'),
 'nexus-sqlite-core':('数据与文件','DATA','离线数据与发送队列'), 'nexus-file-workflow':('数据与文件','FILES','附件导入与版本交接'),
 'aiko-doc-scan':('文档与图像','CAPTURE','文档扫描与透视矫正'), 'aiko-doc-viewer':('文档与图像','READER','应用内文档阅读'),
 'aiko-image-edit':('文档与图像','IMAGE','裁剪、编辑与隐私处理'), 'aiko-gallery-hub':('多媒体','GALLERY','媒体查询与交接'),
 'aiko-video-edit':('多媒体','VIDEO','视频处理与任务控制'), 'aiko-video-thumb':('多媒体','FRAME','视频取帧与封面创作'),
 'aiko-bg-audio':('音频与语音','SOUND','后台播放与收听体验'), 'aiko-smart-tts':('音频与语音','SPEAK','系统语音与播报队列'),
 'aiko-asr':('音频与语音','LISTEN','系统语音识别'), 'aiko-call-recorder':('音频与语音','RECORD','系统录音与音频转码'),
 'aiko-live-player':('多媒体','LIVE','原生视频播放'), 'aiko-cast-core':('多媒体','CAST','DLNA设备发现与投屏'),
 'aiko-share-core':('数据与文件','SHARE','文本、多文件与授权交接'), 'aiko-geo-core':('系统与业务','LOCATION','定位与围栏接口'),
 'aiko-device-id':('系统与业务','IDENTITY','设备标识与可用性诊断'), 'aiko-keep-alive':('系统与业务','ALIVE','前台服务与运行保障'),
 'aiko-float-window':('系统与业务','WINDOW','系统悬浮窗口'), 'aiko-alipay-core':('系统与业务','ALIPAY','支付宝授权与支付桥接'),
 'aiko-wechat-core':('系统与业务','WECHAT','微信接入诊断与分享')}
order=['aiko-scan-pro','nexus-sqlite-core','nexus-file-workflow','aiko-ble-core','aiko-doc-scan','aiko-doc-viewer','aiko-image-edit','aiko-gallery-hub','aiko-video-edit','aiko-video-thumb','aiko-bg-audio','aiko-smart-tts','aiko-asr','aiko-call-recorder','aiko-live-player','aiko-cast-core','aiko-share-core','aiko-geo-core','aiko-device-id','aiko-keep-alive','aiko-float-window','aiko-alipay-core','aiko-wechat-core']
shotnames={'aiko-alipay-core':'01-alipay.png','aiko-asr':'02-asr.png','aiko-ble-core':'03-ble-core.png','aiko-call-recorder':'04-call-recorder.png','aiko-cast-core':'05-cast-core.png','aiko-device-id':'06-device-id.png','aiko-doc-scan':'07-doc-scan.png','aiko-doc-viewer':'08-doc-viewer.png','aiko-float-window':'09-float-window.png','aiko-gallery-hub':'10-gallery-hub.png','aiko-geo-core':'11-geo-core.png','aiko-image-edit':'12-image-edit.png','aiko-keep-alive':'13-keep-alive.png','aiko-live-player':'14-live-player.png','aiko-scan-pro':'15-scan-pro.png','aiko-share-core':'16-share-core.png','aiko-smart-tts':'17-smart-tts.png','aiko-video-edit':'18-video-edit.png','aiko-video-thumb':'19-video-thumb.png','aiko-wechat-core':'20-wechat-core.png'}
effects={'aiko-doc-viewer':('document-effect.png','实际Markdown阅读'),'aiko-video-edit':('video-effect.png','实际三帧预览拼图'),'aiko-video-thumb':('thumbnail-effect.png','实际Nexus水印封面')}
wave={'aiko-scan-pro','nexus-sqlite-core','nexus-file-workflow','aiko-ble-core','aiko-doc-scan','aiko-doc-viewer','aiko-image-edit','aiko-gallery-hub','aiko-video-edit','aiko-video-thumb'}
manifest=[]
def copy_asset(src, target):
    shutil.copy2(src,HERE/target)
    manifest.append({'path':target,'sha256':hashlib.sha256((HERE/target).read_bytes()).hexdigest()})
    return target

def editorial_cover(pid,name,kicker,number):
    label=html.escape(name.replace('Nexus ',''));kicker=html.escape(kicker)
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#F2F0E8"/><rect x="64" y="64" width="76" height="76" rx="22" fill="#DEF04B"/><text x="80" y="120" font-family="Georgia,serif" font-size="60" font-weight="700" fill="#12100D">n.</text><text x="164" y="114" font-family="sans-serif" font-size="25" font-weight="700" fill="#12100D">NEXUS / PLUGIN ATLAS</text><text x="64" y="255" font-family="sans-serif" font-size="25" fill="#858779">{kicker}</text><text x="64" y="390" font-family="sans-serif" font-size="66" font-weight="900" fill="#12100D">{label}</text><text x="64" y="462" font-family="sans-serif" font-size="24" fill="#858779">ANDROID / UNI-APP X</text><path d="M64 660H770" stroke="#CACDBD"/><text x="64" y="708" font-family="sans-serif" font-size="18" fill="#858779">BY NEXUS WANG</text><rect x="930" y="64" width="606" height="772" rx="46" fill="#12160E"/><text x="972" y="121" font-family="sans-serif" font-size="18" fill="#BBC0AF">NEXUS / LOCAL DEVELOPMENT</text><text x="972" y="410" font-family="Georgia,serif" font-size="190" fill="#DEF04B">{number:02d}</text><path d="M972 495H1494M972 520H1380M972 545H1440" stroke="#62684E"/><text x="972" y="715" font-family="sans-serif" font-size="29" fill="#F2F0E8">让能力，进入应用。</text><text x="972" y="770" font-family="sans-serif" font-size="17" fill="#BBC0AF">封面设计 · 非实际操作截图</text></svg>'''
    target=f'assets/covers/{pid}.svg';(HERE/target).write_text(svg);manifest.append({'path':target,'sha256':hashlib.sha256(svg.encode()).hexdigest()});return target

plugins=[]
for index,pid in enumerate(order,1):
    d=source/pid
    if not (d/'package.json').exists():continue
    p=json.loads((d/'package.json').read_text());cat,short,purpose=category[pid];ov=overrides.get(pid,{})
    name=p.get('displayName',pid);version=p.get('version','');readme=(d/'readme.md').read_text() if (d/'readme.md').exists() else ''
    readme=re.sub(r'/Users/[^\s`"\)<>]+','<本地工程路径>',readme)
    if re.search(r'gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{30,}|BEGIN [A-Z ]*PRIVATE KEY',readme):raise RuntimeError('Potential secret in public README: '+pid)
    (HERE/'docs'/f'{pid}.md').write_text(readme)
    cover=copy_asset(d/'cover.png',f'assets/covers/{pid}.png') if (d/'cover.png').exists() else editorial_cover(pid,name,short,index)
    screens=[]
    if pid in shotnames:
        f=output/'Nexus演示页真机截图'/shotnames[pid]
        if f.exists():screens.append({'src':copy_asset(f,f'assets/screens/{pid}.png'),'label':'Android演示页 · 默认/待授权状态','kind':'runtime','version':'第一轮已发布演示'})
    if pid in effects:
        f,label=effects[pid];path=output/'Nexus演示页真机截图'/f
        if path.exists():screens.append({'src':copy_asset(path,f'assets/screens/{f}'),'label':label+' · 自建样本','kind':'operation'})
    for j,x in enumerate(ov.get('screens',[])):
        f=Path(x['file']);f=f if f.is_absolute() else output/f
        if f.exists():screens.insert(j,{'src':copy_asset(f,f'assets/screens/{pid}-wave-{j}{f.suffix}'),'label':x.get('label','本轮Android实际画面'),'kind':'operation','version':'本轮Android实机画面'})
    isnew=pid.startswith('nexus-');market=base_market.get(pid,{})
    marketurl=None if isnew else f'https://ext.dcloud.net.cn/plugin?name={pid}'
    published=ov.get('publishedVersion',market.get('version'))
    if isnew:
        state='local';stateLabel='本地开发 · 尚未上架';marketurl=ov.get('marketUrl');published=ov.get('publishedVersion')
        if marketurl:state='published';stateLabel='已上架'
    elif pid=='aiko-bg-audio':state='independent';stateLabel='独立维护 · 查看市场状态'
    elif published and published!=version:state='upgrading';stateLabel='已上架 · 本轮升级待发布'
    else:state='published';stateLabel='已上架'
    state=ov.get('state',state);stateLabel=ov.get('stateLabel',stateLabel)
    platforms=p.get('uni_modules',{}).get('platforms',{}).get('client',{}).get('uni-app-x',{}).get('app',{})
    verified=ov.get('verification','真实演示页已收录；具体功能验收与限制见README。' if screens else '本目录未收录此插件真实运行截图；支持和测试范围见README。')
    plugins.append({'id':pid,'number':index,'name':name,'shortName':name.replace('Nexus ',''),'category':cat,'kicker':short,'purpose':purpose,'description':p.get('description',''),'version':version,'publishedVersion':published,'marketCheckedAt':ov.get('checkedAt',market.get('checkedAt')),'state':state,'stateLabel':stateLabel,'marketUrl':marketurl,'author':p.get('author','Nexus Wang'),'readme':readme,'docUrl':f'docs/{pid}.md','cover':cover,'screens':screens,'wave10':pid in wave,'platforms':platforms,'verification':verified,'hasLocalDoc':bool(readme),'externalOnly':False})
for pid,name,num,desc in [('aikit','AIKit',28709,'市场组件条目。本地未收录对应源码和说明，请在官方插件市场查看功能、版本与支持平台。'),('365dailycard','365DailyCard',22200,'市场组件条目。本地未收录对应源码和说明，请在官方插件市场查看功能、版本与支持平台。')]:
    idx=len(plugins)+1;cover=editorial_cover(pid,name,'MARKET ENTRY',idx)
    plugins.append({'id':pid,'number':idx,'name':name,'shortName':name,'category':'市场组件','kicker':'COMPONENT','purpose':'官方市场条目','description':desc,'version':None,'publishedVersion':None,'state':'external','stateLabel':'市场外链 · 文档未收录','marketUrl':f'https://ext.dcloud.net.cn/plugin?id={num}','author':'Nexus Wang','readme':'','docUrl':None,'cover':cover,'screens':[],'wave10':False,'platforms':{},'verification':'没有本地文档或本任务真实截图；请核对市场页。','hasLocalDoc':False,'externalOnly':True})
data={'brand':'Nexus Wang','title':'Nexus Plugin Atlas','updatedAt':datetime.now().astimezone().isoformat(),'githubUrl':args.github,'plugins':plugins,'categories':list(dict.fromkeys(x['category'] for x in plugins)),'scope':'公开文档和展示图集。没有收费插件源码、APK、密钥、账户资料。截图不等于所有功能验收；市场版本和价格以官方页面为准。'}
(HERE/'catalog.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(HERE/'asset-manifest.json').write_text(json.dumps({'assets':manifest,'count':len(manifest)},ensure_ascii=False,indent=2)+'\n')
(HERE/'.nojekyll').touch()
(HERE/'README.md').write_text('''# Nexus Plugin Atlas\n\nNexus Wang 的 uni-app 插件公开文档集合与画廊。\n\n- 搜索与分类筛选、封面/Android实机图切换、完整README阅读、市场外链。\n- 新开发未上架、已发布旧版本与本轮升级分别标注。没有用本地版本冒充已发布版本。\n- 仅包含公开说明、封面及审核过的展示截图，不包含收费插件源码、APK或密钥。\n- 默认/待授权截图说明页面真实显示，不等于所有功能已经验收。外设、平台限制请读每款README。\n\n## 本地查看\n\n在本目录运行 `python3 -m http.server 18768`，浏览器打开 `http://127.0.0.1:18768`。使用HTTP而不是file协议，以便加载catalog.json。无npm安装或构建依赖，不加载外部字体或CDN脚本。\n\n## 更新\n\n导出脚本仅在作者本地有原工程时运行：\n\n```sh\npython3 build-catalog.py --project '/path/to/uniapp-project' --outputs '/path/to/public-outputs' --github 'https://github.com/OWNER/REPO'\n```\n\n仅复制明确的readme.md、cover.png和展示截图白名单，不复制utssdk目录。脚本支持`--overrides`指定最终发布/测试状态JSON；构建后请重新浏览核对。源工程路径由--project显式传入，仅用于本地导出；GitHub Actions不会读取本地工程。\n\n## GitHub Pages\n\n仓库提供Pages部署workflow；仓库Settings → Pages的Source选择GitHub Actions后，推送main自动发布静态页面。GitHub Pages地址和发布状态以实际部署为准。\n\n## 内容与安全\n\nREADME使用DOM节点安全渲染：不解析原始HTML、不使用innerHTML、不执行文档脚本。仅允许http(s)/mailto与本站明确的文档资源链接；下载的说明Markdown仍是文本。插件版本与实际购买价请核对各自官方市场页。\n\n作者：Nexus Wang。展示文档不改变各插件的商业授权条件。\n''')
if args.github:
    match=re.fullmatch(r'https://github\.com/([A-Za-z0-9-]+)/([A-Za-z0-9_.-]+)/?',args.github)
    if match:
        live=f"https://{match[1].lower()}.github.io/{match[2]}/"
        readme=HERE/'README.md';text=readme.read_text();text=text.replace('Nexus Wang 的 uni-app 插件公开文档集合与画廊。',f'Nexus Wang 的 uni-app 插件公开文档集合与画廊。\n\n在线查看：[插件集合与真实演示画廊]({live})\n\n本次收录 {len(plugins)} 个插件入口、{sum(x["hasLocalDoc"] for x in plugins)} 篇说明、{sum(bool(x["screens"]) for x in plugins)} 款实机画面、{sum(len(x["screens"]) for x in plugins)} 张真实截图。')
        readme.write_text(text)
print(json.dumps({'plugins':len(plugins),'docs':sum(x['hasLocalDoc'] for x in plugins),'runtimePlugins':sum(bool(x['screens']) for x in plugins),'screens':sum(len(x['screens']) for x in plugins),'assets':len(manifest)},ensure_ascii=False))
