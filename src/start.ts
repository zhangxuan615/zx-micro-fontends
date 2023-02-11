import { getAppList, setAppList } from './appList';
import { setLifeCycle } from './lifeCycle';
import { IAppInfo, IInternalAppInfo, ILifeCycle, AppStatusEn } from './types';
import { listenRoute, reRoute } from './route';
import { importEntry } from 'import-html-entry';

/**
 *
 * @param appList 子应用列表
 * @param lifeCycle 主应用生命周期函数
 *   1. beforeLoad  挂载子应用前
 *   2. mounted  挂载子应用后
 *   3. unmounted  卸载子应用后
 */
const registerMicroApps = (appList: IAppInfo[], lifeCycle?: ILifeCycle) => {
  setAppList(appList);
  lifeCycle && setLifeCycle(lifeCycle);
};

/**
 * 启动微前端
 */
const start = () => {
  const list = getAppList();
  if (!list.length) {
    throw new Error('请先注册应用');
  }

  // 1. 路由劫持
  listenRoute();
  reRoute(window.location.pathname);

  // 2. 预获取子应用资源
  list.forEach((app) => {
    if (app.status === AppStatusEn.NOT_LOADED) {
      prefetch(app as IInternalAppInfo);
    }
  });
};

/**
 * 预加载 app 子应用
 * 入口 html 资源
 * 样式 css 资源
 * js 资源
 */

const prefetch = async (app: IInternalAppInfo) => {
  requestIdleCallback(async () => {
    const { getExternalScripts, getExternalStyleSheets } = await importEntry(
      app.entry
    );
    requestIdleCallback(getExternalStyleSheets);
    requestIdleCallback(getExternalScripts);
  });
};

export { registerMicroApps, start };
