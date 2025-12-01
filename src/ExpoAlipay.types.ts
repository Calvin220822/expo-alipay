export interface AlipayPaymentResult {
  resultStatus: string;
  result?: string;
  memo?: string;
}

export interface AlipayAuthResult {
  resultStatus: string;
  result?: string;
  memo?: string;
  resultCode?: string;
  authCode?: string;
  alipayOpenId?: string;
}

export interface ExpoAlipayModule {
  /**
   * 设置支付宝的 URL Scheme (iOS only)
   * @param scheme URL Scheme, 例如 "alipay" 或你的 app scheme
   */
  setAlipayScheme(scheme: string): void;

  /**
   * 设置支付宝的 App ID
   * @param appId 支付宝开放平台申请的 App ID
   */
  setAppId(appId: string): void;

  /**
   * 发起支付宝支付
   * @param orderString 订单信息字符串(从服务端获取)
   * @returns Promise<AlipayPaymentResult> 支付结果
   */
  pay(orderString: string): Promise<AlipayPaymentResult>;

  /**
   * 发起支付宝授权
   * @param authInfo 授权信息字符串(从服务端获取)
   * @returns Promise<AlipayAuthResult> 授权结果
   */
  auth(authInfo: string): Promise<AlipayAuthResult>;

  /**
   * 检查支付宝是否已安装
   * @returns Promise<boolean> 是否已安装支付宝
   */
  isAlipayInstalled(): Promise<boolean>;
}
