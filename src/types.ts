import { ProxySandbox } from './loader/ProxySandbox';

// 子应用生命周期状态
export enum AppStatusEn {
  NOT_LOADED = 'NOT_LOADED', // 子应用初始化的资源未加载状态

  LOADING = 'LOADING', // 开始加载子应用资源
  LOADED = 'LOADED', // 子应用资源加载完成

  BOOTSTRAPPING = 'BOOTSTRAPPING', // 子应用首次触发加载
  NOT_MOUNTED = 'NOT_MOUNTED', // 子应用未挂载

  MOUNTING = 'MOUNTING', // 开始挂载子应用
  MOUNTED = 'MOUNTED', // 子应用挂载完成

  UNMOUNTING = 'UNMOUNTING', // 卸载前
}

// 主子应用生命周期函数类型
export type LifeCycle = (app: IAppInfo) => Promise<any>;

// 子应用基本信息配置
export interface IAppInfo {
  name: string; // 子应用名词
  entry: string; // 子应用的资源入口
  activeRule:
    | string
    | ((location: string) => boolean)
    | Array<string | ((location: string) => boolean)>; // 在哪些路由下渲染该子应用
  container: string; // 主应用渲染子应用的节点
}

// 内部维护的子应用状态
export interface IInternalAppInfo extends IAppInfo {
  status: AppStatusEn; // 子应用状态
  proxy?: ProxySandbox;

  // 通常是在子应用中注册
  htmlTemplate?: string;
  bootstrap?: LifeCycle;
  mount?: LifeCycle;
  unmount?: LifeCycle;
}

// 主应用生命周期函数
export interface ILifeCycle {
  beforeLoad?: LifeCycle | LifeCycle[]; // 加载资源前
  beforeMount?: LifeCycle | LifeCycle[]; // 挂载子应用前
  afterMount?: LifeCycle | LifeCycle[]; // 挂载子应用完成
  beforeUnmount?: LifeCycle | LifeCycle[]; // 卸载子应用前
  afterUnmount?: LifeCycle | LifeCycle[]; // 卸载子应用完成
}
