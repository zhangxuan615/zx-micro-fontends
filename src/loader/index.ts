import { IInternalAppInfo } from '../types';
import { importEntry } from 'import-html-entry';
import { ProxySandbox } from './ProxySandbox';

/**
 * 使用 import-html-entry 库加载解析静态资源
 * 1. 加载 html 资源，并解析为 dom 树对象；
 * 2. 从 dom 树对象中解析 css 资源地址，并加载；
 * 3. 从 dom 树对象中解析 js 资源，并加载解析出子应用生命周期函数
 */
export const loadHTML = async (app: IInternalAppInfo) => {
  const { entry } = app;

  // a. 根据 entry 开始加载解析静态资源
  // template：处理 HTML 文本未 HTML 文档对象
  // getExternalStyleSheets：fetch CSS 文件
  // getExternalScripts：fetch JS 文件
  const { template, getExternalScripts, getExternalStyleSheets } =
    await importEntry(entry);

  // b. 处理 css 样式资源与 js 资源
  // b.1 加载 css 外联样式，并将其以内联样式注入到 template 文档对象中
  const cssCodeArr = await getExternalStyleSheets();
  app.htmlTemplate = cssCodeArr.reduce((pre, cssCode, index) => {
    return dynamicAppendStyle(cssCode, index, pre);
  }, template);

  // b.2 加载 js 外联，并提取子应用的生命周期函数
  const jsCode = await getExternalScripts();
  jsCode.forEach((script) => {
    const lifeCycle = runJS(script, app);
    if (lifeCycle) {
      app.bootstrap = lifeCycle.bootstrap;
      app.mount = lifeCycle.mount;
      app.unmount = lifeCycle.unmount;
    }
  });

  return app;
};

/**
 * 替换 html 文本中的外联样式未内联样式
 */
const dynamicAppendStyle = (
  cssCode: string,
  index: number,
  template: string
) => {
  return template;
};

/**
 * 1. 激活当前子应用 js 沙箱
 * 2. 返回子应用注册的生命周期函数：bootstrap、mount、unmount
 */
const runJS = (value: string, app: IInternalAppInfo) => {
  if (!app.proxy) {
    app.proxy = new ProxySandbox();
    // @ts-ignore
    window.__CURRENT_PROXY__ = app.proxy.proxy;
  }
  app.proxy.active();
  const code = `
    return (window => {
      ${value}
      return window['${app.name}']
    })(window.__CURRENT_PROXY__)
  `;
  return new Function(code)();
};
