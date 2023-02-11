import { getAppList } from 'src/appList';
import { AppStatusEn, IInternalAppInfo } from 'src/types';

/**
 * 判断当前路由是否激活子应用
 */
function getAppIsActive(curPathname: string, app: IInternalAppInfo) {
  const { activeRule } = app;

  let isActive = false;
  if (typeof activeRule === 'string') {
    isActive = curPathname.startsWith(activeRule); // 路由前缀匹配
  } else if (typeof activeRule === 'function') {
    isActive = activeRule(curPathname);
  } else if (Array.isArray(activeRule)) {
    activeRule.some((itemRule) => {
      if (typeof itemRule === 'string') {
        return (isActive = curPathname.startsWith(itemRule));
      } else if (typeof itemRule === 'function') {
        return (isActive = itemRule(curPathname));
      }

      return false;
    });
  }

  return isActive;
}

/**
 * 获取子应用状态
 * 1. axtiveApps： 当前被激活的子应用
 * 2. unmountApps：当前卸载的子应用
 */
export const getAppListStatus = (curPathname: string = location.pathname) => {
  let activeApp: IInternalAppInfo | null = null;
  let unmountApp: IInternalAppInfo | null = null;

  const appList = getAppList(); // 获取所有子应用信息
  appList.forEach((app) => {
    // 判断 子应用路由 是否为当前页面路由
    let isActive = getAppIsActive(curPathname, app);
    switch (app.status) {
      case AppStatusEn.NOT_LOADED:
      case AppStatusEn.LOADING:
      case AppStatusEn.LOADED:
      case AppStatusEn.BOOTSTRAPPING:
      case AppStatusEn.NOT_MOUNTED:
        isActive && (activeApp = app);
        break;
      case AppStatusEn.MOUNTED:
        !isActive && (unmountApp = app);
        break;
    }
  });

  return { activeApp, unmountApp } as {
    activeApp: IInternalAppInfo | null;
    unmountApp: IInternalAppInfo | null;
  };
};
