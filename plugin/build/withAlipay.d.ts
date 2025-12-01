import { ConfigPlugin } from '@expo/config-plugins';
/**
 * Plugin 配置选项
 */
export interface AlipayPluginProps {
    /**
     * URL Scheme for iOS
     * @default "alipay"
     */
    scheme?: string;
}
/**
 * Expo Config Plugin for Alipay
 */
declare const withAlipay: ConfigPlugin<AlipayPluginProps>;
export default withAlipay;
