import { AlipayPaymentResult, AlipayAuthResult, AlipayH5PaymentResult } from './ExpoAlipay.types';
import { EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to ExpoAlipay.web.ts
// and on native platforms to ExpoAlipay.ts
import ExpoAlipayModule from './ExpoAlipayModule';

// Event emitter for H5 payment results
const emitter = new EventEmitter(ExpoAlipayModule);

/**
 * 设置支付宝的 URL Scheme (iOS only)
 * @param scheme URL Scheme, 例如 "alipay" 或你的 app scheme
 */
export function setAlipayScheme(scheme: string): void {
  return ExpoAlipayModule.setAlipayScheme(scheme);
}

/**
 * 设置支付宝的 App ID
 * @param appId 支付宝开放平台申请的 App ID
 */
export function setAppId(appId: string): void {
  return ExpoAlipayModule.setAppId(appId);
}

/**
 * 发起支付宝支付
 * @param orderString 订单信息字符串(从服务端获取)
 * @returns Promise<AlipayPaymentResult> 支付结果
 */
export async function pay(orderString: string): Promise<AlipayPaymentResult> {
  return await ExpoAlipayModule.pay(orderString);
}

/**
 * H5支付URL拦截方法（同步）
 * 用于在 WebView 的 URL 变化时拦截支付宝H5支付URL
 *
 * @param url 需要拦截的URL
 * @returns boolean 是否被拦截（true=已拦截,WebView不应继续加载；false=未拦截,WebView应继续加载）
 *
 * 使用方式：
 * 1. 在 WebView 的 onShouldStartLoadWithRequest (iOS) 或 onNavigationStateChange (Android) 中调用
 * 2. 监听 onH5PayResult 事件获取支付结果
 *
 * @example
 * ```typescript
 * // 监听支付结果事件
 * const subscription = addH5PayResultListener((result) => {
 *   if (result.returnUrl) {
 *     webviewRef.current.injectJavaScript(`window.location.href = "${result.returnUrl}"`);
 *   }
 * });
 *
 * // WebView URL 拦截
 * <WebView
 *   onShouldStartLoadWithRequest={(request) => {
 *     const isIntercepted = payInterceptorWithUrl(request.url);
 *     return !isIntercepted; // true=继续加载, false=拦截
 *   }}
 * />
 *
 * // 清理监听
 * subscription.remove();
 * ```
 */
export function payInterceptorWithUrl(url: string): boolean {
  return ExpoAlipayModule.payInterceptorWithUrl(url);
}

/**
 * 添加H5支付结果监听器
 * @param listener 支付结果回调函数
 * @returns Subscription 订阅对象，调用 remove() 可取消监听
 */
export function addH5PayResultListener(
  listener: (result: AlipayH5PaymentResult) => void
): Subscription {
  return emitter.addListener('onH5PayResult', listener);
}

/**
 * 发起支付宝授权
 * @param authInfo 授权信息字符串(从服务端获取)
 * @returns Promise<AlipayAuthResult> 授权结果
 */
export async function auth(authInfo: string): Promise<AlipayAuthResult> {
  return await ExpoAlipayModule.auth(authInfo);
}

/**
 * 检查支付宝是否已安装
 * @returns Promise<boolean> 是否已安装支付宝
 */
export async function isAlipayInstalled(): Promise<boolean> {
  return await ExpoAlipayModule.isAlipayInstalled();
}

export * from './ExpoAlipay.types';
