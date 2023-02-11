/**
 * 自己实现的 import-html-entry 底层原理
 */

import { fetchResource, getCompletionURL } from './_utils';
import { IInternalAppInfo } from '../types';

const links: string[] = []; // 样式资源外链地址
const scripts: string[] = []; // js 脚本外链地址
const inlineScript: string[] = []; // js 脚本内联内容

export const loadHTML = async (app: IInternalAppInfo) => {
  const { entry, name } = app;

  // 1. 加载 html 资源，并解析为 HTML 文档输
  const htmlFile = await fetchResource(entry, name);
  const fakeContainer = document.createElement('div');
  fakeContainer.innerHTML = htmlFile;

  // 2. 从 HTML 文档树中提取 js 资源 和 css-link 资源
  const { scripts, links, inlineScript } = parseHTML(fakeContainer, app);

  // 2.1 加载所有的 link 资源
  await Promise.all(links.map((link) => fetchResource(link, name)));

  // 2.2 加载所有的 js 资源，并准备执行
  const jsCode = (
    await Promise.all(scripts.map((script) => fetchResource(script, name)))
  ).concat(inlineScript);

  return app;
};

/**
 * 递归遍历子应用的 dom 树：
 * 从 dom 树中捞出 link、script、img 标签
 */
export const parseHTML = (root: HTMLElement, app: IInternalAppInfo) => {
  // parent.children - HTMLCollection
  const children = Array.from(root.children) as HTMLElement[];
  children.length && children.forEach((item) => parseHTML(item, app));

  for (const dom of children) {
    if (/^(link)$/i.test(dom.tagName)) {
      const data = parseLink(dom, root, app);
      data && links.push(data);
    } else if (/^(script)$/i.test(dom.tagName)) {
      const data = parseScript(dom, root, app);
      data.text && inlineScript.push(data.text);
      data.url && scripts.push(data.url);
    } else if (/^(img)$/i.test(dom.tagName) && dom.hasAttribute('src')) {
      // 处理图片资源地址的路径问题
      dom.setAttribute(
        'src',
        getCompletionURL(dom.getAttribute('src'), app.entry)!
      );
    }
  }

  return { scripts, links, inlineScript };
};

/**
 * 处理 script 节点
 * 内联脚本：返回脚本字符串
 * 外链脚本：返回脚本url
 */
const parseScript = (
  scriptDom: HTMLElement,
  rootDom: HTMLElement,
  app: IInternalAppInfo
) => {
  const scriptSrc = scriptDom.getAttribute('src');
  rootDom.replaceChild(
    document.createComment(
      `${!scriptSrc ? 'inline' : ''} script replaced by micro`
    ),
    scriptDom
  );
  // 返回 script 脚本内容 或者 脚本地址
  return {
    url: getCompletionURL(scriptSrc, app.entry),
    text: scriptDom.innerHTML,
  };
};

/**
 * 返回 style 样式资源 url
 */
const parseLink = (
  linkDom: HTMLElement,
  rootDom: HTMLElement,
  app: IInternalAppInfo
) => {
  /**
   * 外联样式：<link href="/css/main_240f9.css" rel="stylesheet">
   *
   */
  const rel = linkDom.getAttribute('rel'); // 样式
  const href = linkDom.getAttribute('href');
  if (rel === 'stylesheet' && href) {
    // 如果是外部样式资源
    rootDom.replaceChild(
      document.createComment(`link replaced by micro`), // 替换为注释
      linkDom
    );
    return getCompletionURL(href, app.entry);
  } else if (href) {
    // 其他资源处理一下 url
    linkDom.setAttribute('href', getCompletionURL(href, app.entry)!);
  }
};
