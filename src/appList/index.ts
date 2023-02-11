import { IAppInfo, IInternalAppInfo, AppStatusEn } from '../types';

// 内部维护的子应用状态
const appList: IInternalAppInfo[] = [];

// 注册子应用信息
export const setAppList = (list: IAppInfo[]) => {
  list.forEach((item) => {
    appList.push({
      ...item,
      status: AppStatusEn.NOT_LOADED, // 子应用默认都是资源未加载状态
    });
  });
};

// 获取子应用信息
export const getAppList = () => {
  return appList;
};
