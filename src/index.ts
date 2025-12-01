import { AlipayPaymentResult, AlipayAuthResult } from './ExpoAlipay.types';

// Import the native module. On web, it will be resolved to ExpoAlipay.web.ts
// and on native platforms to ExpoAlipay.ts
import ExpoAlipayModule from './ExpoAlipayModule';

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
