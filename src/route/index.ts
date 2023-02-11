import {
  runBeforeLoad,
  runBoostrap,
  runMounted,
  runUnmounted,
} from '../lifeCycle';
import { AppStatusEn, IInternalAppInfo } from '../types';
import { getAppListStatus } from './_utils';

let capturedPopstateListeners: Function[] = [];

// 劫持和 history  相关的事件和函数
// 然后我们在劫持的方法里做一些自己的事情
// 比如说在 URL 发生改变的时候判断当前是否切换了子应用

// 保存原有方法
const originalPush = window.history.pushState;
const originalReplace = window.history.replaceState;

let lastUrl: string | null = null;
let lastApp: IInternalAppInfo | null = null;

// 路由切换统一处理
export const reRoute = async (
  curPathname: string = location.pathname,
  event?: PopStateEvent
) => {
  if (curPathname !== lastUrl) {
    const { activeApp, unmountApp } = getAppListStatus(); // 找出将要激活的子应用、将要卸载的子应用
    // 1. 先卸载已有的子应用
    unmountApp && (await runUnmounted(unmountApp));

    if (activeApp && activeApp !== lastApp) {
      // 2. 挂载激活的子应用：
      // 2.1 第一次挂载
      activeApp?.status === AppStatusEn.NOT_LOADED &&
        (await runBeforeLoad(activeApp)) &&
        (await runBoostrap(activeApp));
      // 2.2 后续再次挂载
      await runMounted(activeApp);

      lastUrl = curPathname;
      lastApp = activeApp;
    }
  }

  // 等到子应用加载卸载处理完成，执行 popstate 事件劫持到的事件函数
  event &&
    capturedPopstateListeners.forEach((listener) => {
      listener.apply(event);
    });
};

/**
 * 路由劫持：核心代码
 * 1. 重写 pushState 以及 replaceState 方法
 * 2. 监听 popstate 事件
 * 3. 劫持 addEventListener、removeEventListener 事件
 */
export const listenRoute = () => {
  // div.click 与div.dispatchEvent 都是同步的

  // const mouseEvent = new MouseEvent('click', {});
  // div1.dispatchEvent(mouseEvent);
  // 1. 重写 pushState 以及 replaceState 方法
  window.history.pushState = (data: any, unused: string, url: string) => {
    originalPush.call(this, data, unused, url);
    url && reRoute(url);
  };
  window.history.replaceState = (data: any, unused: string, url: string) => {
    originalReplace.call(this, data, unused, url);
    url && reRoute(url);
  };

  // 2. 监听 popstate 事件
  window.addEventListener('popstate', (e) => reRoute(location.pathname, e));

  // 3. 劫持 addEventListener、removeEventListener 事件
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.addEventListener;
  window.addEventListener = function (name: string, fn: any) {
    if (
      name === 'popstate' &&
      !capturedPopstateListeners.find((item) => item === fn)
    ) {
      // 注册事件
      capturedPopstateListeners.push(fn);
      return;
    }

    // 一般的处理
    return originalAddEventListener(name, fn);
  };
  window.addEventListener = function (name: string, fn: any) {
    if (name === 'popstate') {
      // 解绑事件
      capturedPopstateListeners = capturedPopstateListeners.filter(
        (item) => item !== fn
      );
      return;
    }

    // 一般的处理
    return originalRemoveEventListener(name, fn);
  };
};
