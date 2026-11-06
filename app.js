'use strict';

const $ = (id) => document.getElementById(id);
const state = { data: null, category: '全部', query: '', galleryMode: 'cover', featureMode: 'cover', current: null, previousFocus: null };
const dialog = $('pluginDialog');
const imageDialog = $('imageDialog');

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
function safeUrl(raw, allowRelative = false) {
  const value = String(raw || '').trim();
  if (!value || /[\u0000-\u001f]/.test(value)) return null;
  if (/^https?:\/\//i.test(value) || /^mailto:/i.test(value)) {
    try { const url = new URL(value); return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null; } catch { return null; }
  }
  if (allowRelative && /^(?:assets|docs)\/[A-Za-z0-9_./-]+$/.test(value) && !value.split('/').includes('..')) return value;
  return null;
}
function externalLink(text, url, className) {
  const link = element('a', className, text);
  const safe = safeUrl(url, true);
  if (safe) { link.href = safe; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  return link;
}

// Public Markdown is text, not a source of executable HTML. Every visible node is
// created with DOM APIs; URLs are allowlisted, and raw HTML remains literal text.
function appendInline(parent, text) {
  const token = /(`[^`\n]+`|!\[[^\]\n]*\]\([^\)\n]+\)|\[[^\]\n]+\]\([^\)\n]+\)|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*)/g;
  let cursor = 0; let match;
  while ((match = token.exec(text)) !== null) {
    parent.append(document.createTextNode(text.slice(cursor, match.index)));
    const value = match[0];
    if (value.startsWith('`')) parent.append(element('code', '', value.slice(1, -1)));
    else if (value.startsWith('![')) {
      const end = value.indexOf(']('); const label = value.slice(2, end); const url = safeUrl(value.slice(end + 2, -1), true);
      const item = element('span', 'md-image-text', label ? `[图片：${label}]` : '[说明图片]');
      if (url) { const a = externalLink(item.textContent + ' ↗', url); parent.append(a); } else parent.append(item);
    } else if (value.startsWith('[')) {
      const end = value.indexOf(']('); const label = value.slice(1, end); const url = safeUrl(value.slice(end + 2, -1), true);
      if (url) { const link = externalLink('', url); appendInline(link, label); parent.append(link); } else parent.append(document.createTextNode(label));
    } else if (value.startsWith('**') || value.startsWith('__')) { const bold = element('strong'); appendInline(bold, value.slice(2, -2)); parent.append(bold); }
    else { const em = element('em'); em.textContent = value.slice(1, -1); parent.append(em); }
    cursor = match.index + value.length;
  }
  parent.append(document.createTextNode(text.slice(cursor)));
}
function tableCells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((x) => x.trim().replace(/\\\|/g, '|'));
}
function isTableSeparator(line) { return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line); }
function documentLines(markdown) {
  const input = markdown.replace(/\r\n?/g, '\n').split('\n');
  const output = []; let chunk = []; let fence = null; let inComment = false;
  const inlineCode = [];
  const flush = () => {
    if (!chunk.length) return;
    let text = chunk.join('\n');
    // These are presentation wrappers, not an instruction to parse HTML. The
    // image gallery above already contains the reviewed local image assets.
    text = text.replace(/<(script|style|iframe|object|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
    text = text.replace(/<\/?(?:p|div|section|article|br|hr)\b[^>]*>/gi, '\n');
    text = text.replace(/<\/?[A-Za-z][A-Za-z0-9:-]*(?:\s+[^<>]*)?\s*\/?>/g, '');
    text = text.replace(/\u0000INLINE_CODE_(\d+)\u0000/g, (_, index) => inlineCode[Number(index)]);
    output.push(...text.split('\n')); chunk = [];
  };
  for (const line of input) {
    if (fence) {
      output.push(line);
      const close = line.trim().match(/^(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null;
      continue;
    }
    const open = !inComment && line.match(/^\s*(`{3,}|~{3,})/);
    if (open) { flush(); fence = open[1]; output.push(line); continue; }
    let clean = ''; let index = 0;
    while (index < line.length) {
      if (inComment) { const end = line.indexOf('-->', index); if (end < 0) break; inComment = false; index = end + 3; continue; }
      if (line.startsWith('<!--', index)) { inComment = true; index += 4; continue; }
      if (line[index] === '`') {
        let run = 1; while (line[index + run] === '`') run++;
        const end = line.indexOf('`'.repeat(run), index + run);
        if (end >= 0) { const key = inlineCode.push(line.slice(index, end + run)) - 1; clean += `\u0000INLINE_CODE_${key}\u0000`; index = end + run; continue; }
      }
      clean += line[index++];
    }
    chunk.push(clean);
  }
  flush(); return output;
}
function renderMarkdown(markdown, host, toc) {
  host.replaceChildren(); toc.replaceChildren();
  const lines = documentLines(markdown);
  let index = 0; let headingCount = 0; const headings = [];
  const isSpecial = (i) => /^\s*(```|~~~)|^#{1,6}\s|^\s*[-*+]\s|^\s*\d+[.)]\s|^>\s?|^\s*([-*_])(?:\s*\1){2,}\s*$/.test(lines[i] || '') || (i + 1 < lines.length && isTableSeparator(lines[i + 1]));
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    const fence = line.match(/^\s*(```+|~~~+)\s*([\w-]*)/);
    if (fence) {
      const content = []; const end = fence[1]; index++;
      while (index < lines.length && !lines[index].trimStart().startsWith(end)) content.push(lines[index++]);
      if (index < lines.length) index++;
      const pre = element('pre'); if (fence[2]) pre.append(element('span', 'code-label', fence[2]));
      pre.append(element('code', '', content.join('\n'))); host.append(pre); continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      const level = heading[1].length; const h = element(`h${level}`); appendInline(h, heading[2]); h.id = `document-heading-${headingCount++}`;
      host.append(h); if (level === 2 || (level === 1 && !headings.length)) headings.push({ text: h.textContent, id: h.id }); index++; continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) { host.append(element('hr')); index++; continue; }
    if (index + 1 < lines.length && line.includes('|') && isTableSeparator(lines[index + 1])) {
      const wrap = element('div', 'table-wrap'); const table = element('table'); const thead = element('thead'); const tr = element('tr');
      for (const cell of tableCells(line)) { const th = element('th'); th.scope = 'col'; appendInline(th, cell); tr.append(th); } thead.append(tr); table.append(thead);
      index += 2; const tbody = element('tbody');
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        const row = element('tr'); for (const cell of tableCells(lines[index])) { const td = element('td'); appendInline(td, cell); row.append(td); } tbody.append(row); index++;
      }
      table.append(tbody); wrap.append(table); host.append(wrap); continue;
    }
    if (/^\s*[-*+]\s|^\s*\d+[.)]\s/.test(line)) {
      const ordered = /^\s*\d+[.)]\s/.test(line); const list = element(ordered ? 'ol' : 'ul');
      while (index < lines.length) {
        const m = lines[index].match(ordered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/);
        if (!m) break;
        const li = element('li'); appendInline(li, m[1]); list.append(li); index++;
      }
      host.append(list); continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = element('blockquote'); const text = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) text.push(lines[index++].replace(/^>\s?/, ''));
      appendInline(quote, text.join('\n')); host.append(quote); continue;
    }
    const content = [line]; index++;
    while (index < lines.length && lines[index].trim() && !isSpecial(index)) content.push(lines[index++]);
    const paragraph = element('p'); appendInline(paragraph, content.join('\n')); host.append(paragraph);
  }
  if (headings.length) {
    toc.append(element('p', '', 'CONTENTS / 说明目录'));
    for (const h of headings) {
      const a = element('a', '', h.text); a.href = `#${h.id}`;
      a.addEventListener('click', (event) => { event.preventDefault(); $(h.id)?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
      toc.append(a);
    }
  }
}
function artImage(src, alt, options = {}) {
  const image = element('img'); image.src = src; image.alt = alt; image.loading = options.eager ? 'eager' : 'lazy'; image.decoding = 'async'; image.width = options.width || 1600; image.height = options.height || 900; return image;
}
function showFullImage(src, caption) {
  $('fullImage').src = src; $('fullImage').alt = caption; $('fullImageCaption').textContent = caption;
  if (!imageDialog.open) imageDialog.showModal();
}
function imageButton(item, plugin, runtime) {
  const button = element('button', runtime ? 'runtime' : ''); button.type = 'button'; button.setAttribute('aria-label', `放大：${plugin.name} · ${item.label}`);
  button.append(artImage(item.src, `${plugin.name} — ${item.label}`), element('span', '', item.label));
  button.addEventListener('click', () => showFullImage(item.src, `${plugin.name} / ${item.label}`)); return button;
}
function openPlugin(id, updateHash = true) {
  const plugin = state.data?.plugins.find((p) => p.id === id); if (!plugin) return;
  state.current = plugin; state.previousFocus = document.activeElement;
  $('detailId').textContent = plugin.id;
  $('detailKicker').textContent = `${String(plugin.number).padStart(2, '0')} / ${plugin.kicker} / ${plugin.category}`;
  $('detailTitle').textContent = plugin.name;
  $('detailDescription').textContent = plugin.description;
  $('detailMeta').replaceChildren();
  const statuses = [plugin.stateLabel];
  if (plugin.version) statuses.push(`本地文档 v${plugin.version}`);
  if (plugin.publishedVersion) statuses.push(`市场已核版本 v${plugin.publishedVersion}`);
  if (plugin.platforms.android === '√') statuses.push('Android uni-app x');
  if (plugin.wave10) statuses.push('本轮 10 项');
  for (const text of statuses) $('detailMeta').append(element('span', /待发布|尚未上架|开发/.test(text) ? 'attention' : '', text));
  const market = $('detailMarketTop'); const marketSafe = safeUrl(plugin.marketUrl);
  market.hidden = !marketSafe; if (marketSafe) market.href = marketSafe; else market.removeAttribute('href');
  $('detailGallery').replaceChildren(imageButton({ src: plugin.cover, label: plugin.coverOrigin === 'official-market' ? '官方市场原始主封面 · 保留原品牌' : '品牌封面 · 非实际操作截图' }, plugin, false));
  for (const screenshot of plugin.screens) $('detailGallery').append(imageButton(screenshot, plugin, true));
  $('detailVerification').textContent = plugin.verification + (plugin.marketCheckedAt ? ` 市场版本核对时间：${plugin.marketCheckedAt.slice(0, 16).replace('T', ' ')}（北京时间）。` : '') + (plugin.id === 'aiko-bg-audio' ? ' 背景音频由独立任务维护，本轮不修改其源码。' : '');
  $('detailActions').replaceChildren();
  if (marketSafe) $('detailActions').append(externalLink('查看官方市场 ↗', marketSafe));
  if (plugin.docUrl) { const download = externalLink('下载 README ↓', plugin.docUrl); download.download = `${plugin.id}.md`; $('detailActions').append(download); }
  if (plugin.hasLocalDoc) renderMarkdown(plugin.readme, $('documentBody'), $('documentToc'));
  else {
    $('documentBody').replaceChildren(); $('documentToc').replaceChildren();
    const notice = element('div', 'notice-panel'); notice.append(element('h3', '', '本地尚未收录这款文档'), element('p', '', '这里保留官方市场入口。功能、版本、平台和价格请以其市场说明为准，本页不推测未收录的能力。'));
    if (marketSafe) notice.append(externalLink('去官方市场查看 ↗', marketSafe)); $('documentBody').append(notice);
  }
  if (!dialog.open) dialog.showModal(); document.body.classList.add('modal-open'); $('dialogScroll').scrollTop = 0;
  if (updateHash) history.pushState({ plugin: id }, '', `#plugin=${encodeURIComponent(id)}`);
}
function closePlugin(updateHash = true) {
  if (imageDialog.open) imageDialog.close();
  if (dialog.open) dialog.close(); document.body.classList.remove('modal-open');
  if (updateHash && location.hash.startsWith('#plugin=')) history.replaceState(null, '', '#catalog');
  state.current = null;
}
function syncRoute() {
  if (location.hash.startsWith('#plugin=')) {
    try { const id = decodeURIComponent(location.hash.slice(8)); openPlugin(id, false); } catch { closePlugin(false); }
  } else if (dialog.open) closePlugin(false);
}
function selectPreview(mode) {
  state.galleryMode = mode;
  for (const [id, selected] of [['galleryCover', mode === 'cover'], ['galleryRuntime', mode === 'runtime']]) { $(id).classList.toggle('is-active', selected); $(id).setAttribute('aria-pressed', String(selected)); }
  $('previewHint').textContent = mode === 'runtime' ? '真实截图单独标注；未收录实机图的条目会显示封面并提示。' : '封面为品牌设计图；实机图单独标注。'; renderGrid();
}
function renderFeatured() {
  const plugin = state.data.plugins.find((p) => p.id === 'aiko-scan-pro') || state.data.plugins[0];
  const runtime = state.featureMode === 'runtime' && plugin.screens.length;
  $('featureImage').src = runtime ? plugin.screens[0].src : plugin.cover;
  $('featureImage').alt = `${plugin.name} · ${runtime ? plugin.screens[0].label : '品牌封面，非实机截图'}`;
  $('featureImage').parentElement.classList.toggle('is-runtime', Boolean(runtime));
  $('featureCaption').textContent = runtime ? plugin.screens[0].label : '工业扫码 · 自定义界面 · 业务确认';
  $('featureNote').textContent = runtime ? (plugin.screens[0].kind === 'operation' ? '本轮Android实际操作画面。工业码样、ROI、设备和长时稳定性各自验收，具体范围请读最新README。' : '此图为第一轮真实演示页；本轮新增ROI、GS1与业务工作流的测试范围请读最新README。') : `封面为品牌设计图。${plugin.stateLabel}，完整能力与验收范围见说明。`;
  $('featureCover').classList.toggle('is-active', !runtime); $('featureRuntime').classList.toggle('is-active', Boolean(runtime));
  $('featureCover').setAttribute('aria-pressed', String(!runtime)); $('featureRuntime').setAttribute('aria-pressed', String(Boolean(runtime)));
  $('featuredPlugin').setAttribute('aria-busy', 'false');
}
function renderFilters() {
  const host = $('categoryFilters'); host.replaceChildren();
  for (const category of ['全部', ...state.data.categories]) {
    const count = state.data.plugins.filter((p) => category === '全部' || p.category === category).length;
    const button = element('button', category === state.category ? 'is-active' : '', category); button.type = 'button'; button.append(element('span', '', String(count))); button.setAttribute('aria-pressed', String(category === state.category));
    button.addEventListener('click', () => { state.category = category; renderFilters(); renderGrid(); }); host.append(button);
  }
}
function renderGrid() {
  const query = state.query.trim().toLocaleLowerCase();
  const filtered = state.data.plugins.filter((p) => (state.category === '全部' || p.category === state.category) && (!query || `${p.id} ${p.name} ${p.description} ${p.category} ${p.purpose}`.toLocaleLowerCase().includes(query)));
  $('resultCount').textContent = `显示 ${String(filtered.length).padStart(2, '0')} / ${state.data.plugins.length} 项${state.category !== '全部' ? ` · ${state.category}` : ''}`;
  $('emptyState').hidden = filtered.length !== 0; const grid = $('pluginGrid'); grid.replaceChildren();
  for (const plugin of filtered) {
    const item = element('article', 'plugin-item');
    const hasRuntime = state.galleryMode === 'runtime' && plugin.screens.length > 0;
    const image = hasRuntime ? plugin.screens[0].src : plugin.cover;
    const art = element('button', `plugin-art-button${hasRuntime ? ' runtime' : ''}${plugin.coverOrigin === 'official-market' && !hasRuntime ? ' market-cover' : ''}`); art.type = 'button'; art.setAttribute('aria-label', `查看${plugin.name}的文档与画廊`);
    art.append(artImage(image, `${plugin.name} — ${hasRuntime ? plugin.screens[0].label : '品牌封面'}`));
    const label = hasRuntime ? (plugin.screens[0].kind === 'operation' ? 'ANDROID / 本轮实际操作' : 'ANDROID / 实机演示页') : (state.galleryMode === 'runtime' ? '未收录实机图 · 当前为封面' : (plugin.coverOrigin === 'official-market' ? 'COVER / 官方市场原始主封面' : 'COVER / 品牌封面'));
    art.append(element('span', `art-label${hasRuntime ? '' : ' is-cover'}`, label), element('span', 'art-arrow', '↗'));
    art.addEventListener('click', () => openPlugin(plugin.id)); item.append(art);
    const eyebrow = element('div', 'item-eyebrow'); eyebrow.append(element('span', '', `${plugin.kicker} / ${plugin.category}`), element('span', '', plugin.wave10 ? 'WAVE 02 / 本轮开发' : (plugin.externalOnly ? 'MARKET ENTRY' : 'NEXUS SERIES'))); item.append(eyebrow);
    const titleRow = element('div', 'item-title-row'); const title = element('h3', 'item-title'); const titleButton = element('button', '', plugin.shortName); titleButton.addEventListener('click', () => openPlugin(plugin.id)); title.append(titleButton); titleRow.append(title, element('span', 'item-number', String(plugin.number).padStart(2, '0'))); item.append(titleRow);
    item.append(element('p', 'item-description', plugin.description));
    const footer = element('div', 'item-footer'); footer.append(element('span', `state-tag ${plugin.state}`, plugin.stateLabel));
    const links = element('div', 'item-links'); const read = element('button', '', plugin.hasLocalDoc ? '阅读说明 ↗' : '查看条目 ↗'); read.addEventListener('click', () => openPlugin(plugin.id)); links.append(read);
    if (plugin.marketUrl) links.append(externalLink('市场 ↗', plugin.marketUrl)); footer.append(links); item.append(footer); grid.append(item);
  }
}
async function loadCatalog() {
  $('loadError').hidden = true;
  try {
    const response = await fetch('./catalog.json', { cache: 'no-cache' }); if (!response.ok) throw new Error('Catalog response failed');
    const data = await response.json(); if (!Array.isArray(data.plugins) || !data.plugins.length) throw new Error('Catalog is empty'); state.data = data;
    $('navCount').textContent = String(data.plugins.length); $('statPlugins').textContent = String(data.plugins.length); $('statDocs').textContent = String(data.plugins.filter((p) => p.hasLocalDoc).length); $('statRuntime').textContent = String(data.plugins.filter((p) => p.screens.length).length);
    const github = safeUrl(data.githubUrl); if (github) { $('githubLink').href = github; $('githubLink').hidden = false; }
    const date = new Date(data.updatedAt); $('updatedLabel').textContent = `${Number.isNaN(date.valueOf()) ? '2026' : new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)} · 文档快照`;
    renderFeatured(); renderFilters(); renderGrid(); syncRoute();
  } catch (error) { $('loadError').hidden = false; $('resultCount').textContent = '目录加载失败'; console.error('Catalog could not be loaded:', error); }
}
$('pluginSearch').addEventListener('input', (event) => { state.query = event.target.value; if (state.data) renderGrid(); });
$('clearFilters').addEventListener('click', () => { state.query = ''; state.category = '全部'; $('pluginSearch').value = ''; renderFilters(); renderGrid(); $('pluginSearch').focus(); });
$('galleryCover').addEventListener('click', () => { if (state.data) selectPreview('cover'); });
$('galleryRuntime').addEventListener('click', () => { if (state.data) selectPreview('runtime'); });
$('featureCover').addEventListener('click', () => { state.featureMode = 'cover'; if (state.data) renderFeatured(); });
$('featureRuntime').addEventListener('click', () => { state.featureMode = 'runtime'; if (state.data) renderFeatured(); });
$('featureOpen').addEventListener('click', () => openPlugin('aiko-scan-pro'));
$('scanShortcut').addEventListener('click', () => openPlugin('aiko-scan-pro'));
$('closeDialog').addEventListener('click', () => closePlugin());
$('closeImage').addEventListener('click', () => imageDialog.close());
dialog.addEventListener('cancel', (event) => { event.preventDefault(); closePlugin(); });
dialog.addEventListener('click', (event) => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closePlugin(); } });
imageDialog.addEventListener('click', (event) => { if (event.target === imageDialog) imageDialog.close(); });
$('retryLoad').addEventListener('click', loadCatalog);
window.addEventListener('hashchange', syncRoute);
window.addEventListener('popstate', syncRoute);
window.addEventListener('keydown', (event) => {
  if (event.key === '/' && !dialog.open && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && !event.metaKey && !event.ctrlKey) { event.preventDefault(); $('pluginSearch').focus(); }
});
loadCatalog();
