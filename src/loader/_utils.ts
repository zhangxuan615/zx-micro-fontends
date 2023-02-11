/**
 * 静态资源加载相关工具
 */

import { getCache, setCache } from './cache';

// 使用 fetch 单独封装网络资源请求
export const fetchResource = async (url: string, appName: string) => {
  if (getCache(appName, url)) {
    return getCache(appName, url);
  }

  const data = await fetch(url).then(async (res) => await res.text());
  setCache(appName, url, data);
  return data;
};

// src/utils
export function getCompletionURL(
  src: string | null,
  baseURI = location.origin
) {
  // 无效请求url
  if (!src) {
    return '';
  }

  // 如果 URL 已经是协议 https http 开头就直接返回
  if (/^https?/.test(src)) {
    return src;
  }

  // 用户在注册应用的 entry 里面可能填入 //xxx
  if (/^\/\//.test(src)) {
    return `${location.protocol}${src}`;
  }

  // src 只为路径
  return new URL(src, baseURI).toString();
}

// 获取完整的 BaseURL
// 因为用户在注册应用的 entry 里面可能填入 //xxx 或者 https://xxx 这种格式的 URL
// export function getCompletionBaseURL(url: string) {
//   // 通过原生方法拼接 URL
//   return new URL(src, getCompletionBaseURL(baseURI)).toString();
//   return url.startsWith("//") ? `${location.protocol}${url}` : url;
// }
