import { IAppInfo, IInternalAppInfo, ILifeCycle, AppStatusEn } from '../types';
import { loadHTML } from '../loader';

/**
 * 主应用生命周期函数
 *   1. beforeLoad  挂载子应用前
 *   2. mounted  挂载子应用后
 *   3. unmounted  卸载子应用后
 */
let lifeCycle: ILifeCycle = {};
export const setLifeCycle = (list: ILifeCycle) => {
  lifeCycle = list;
};
export const getLifeCycle = () => {
  return lifeCycle;
};

/**
 * 子应用生命周期
 */
// 加载子应用资源
export const runBeforeLoad = async (app: IInternalAppInfo) => {
  await runLifeCycle('beforeLoad', app); // 主应用开始加载资源 beforeLoad

  app.status = AppStatusEn.LOADING;
  app = await loadHTML(app);
  app.status = AppStatusEn.LOADED;
};

// 首次应用加载触发，常用于配置子应用全局信息
export const runBoostrap = async (app: IInternalAppInfo) => {
  app.status = AppStatusEn.BOOTSTRAPPING;
  await app.bootstrap?.(app);
  app.status = AppStatusEn.NOT_MOUNTED;
};

// 子应用挂载
// a. 先执行子应用挂载函数  b. 再执行主应用挂载函数
export const runMounted = async (app: IInternalAppInfo) => {
  await runLifeCycle('beforeMount', app); // 主应用开始挂载子应用

  // 子应用挂载
  app.status = AppStatusEn.MOUNTING;
  const dom = document.querySelector(app.container);
  if (!dom) {
    throw new Error('容器不存在');
  }
  await app.mount?.(app); // 子应用完成挂载：执行子应用 render 挂载操作
  app.status = AppStatusEn.MOUNTED;

  await runLifeCycle('afterMount', app); // 主应用完成挂载子应用
};

// 子应用卸载
// a. 先执行子应用卸载函数  b. 再执行主应用卸载函数
export const runUnmounted = async (app: IInternalAppInfo) => {
  await runLifeCycle('beforeMount', app); // 主应用开始卸载子应用

  // 子应用挂载
  app.status = AppStatusEn.UNMOUNTING;
  app.proxy?.inactive();
  await app.unmount?.(app); // 子应用完成卸载
  await runLifeCycle('afterUnmount', app); // 主应用完成卸载子应用

  app.status = AppStatusEn.NOT_MOUNTED;
};

const runLifeCycle = async (name: keyof ILifeCycle, app: IAppInfo) => {
  const fn = lifeCycle[name];
  if (fn instanceof Array) {
    await Promise.all(fn.map((item) => item(app)));
  } else {
    await fn?.(app);
  }
};
