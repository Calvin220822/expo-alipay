import { ConfigPlugin, withInfoPlist, withAndroidManifest } from '@expo/config-plugins';

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
 * 添加 iOS Info.plist 配置
 */
const withAlipayIOS: ConfigPlugin<AlipayPluginProps> = (config, { scheme = 'alipay' }) => {
  return withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;

    // 添加 URL Scheme
    if (!infoPlist.CFBundleURLTypes) {
      infoPlist.CFBundleURLTypes = [];
    }

    const alipayScheme = {
      CFBundleTypeRole: 'Editor',
      CFBundleURLName: 'alipay',
      CFBundleURLSchemes: [scheme],
    };

    const existingSchemeIndex = infoPlist.CFBundleURLTypes.findIndex(
      (type: any) => type.CFBundleURLName === 'alipay'
    );

    if (existingSchemeIndex !== -1) {
      infoPlist.CFBundleURLTypes[existingSchemeIndex] = alipayScheme;
    } else {
      infoPlist.CFBundleURLTypes.push(alipayScheme);
    }

    // 添加 LSApplicationQueriesSchemes
    if (!infoPlist.LSApplicationQueriesSchemes) {
      infoPlist.LSApplicationQueriesSchemes = [];
    }

    if (!infoPlist.LSApplicationQueriesSchemes.includes('alipay')) {
      infoPlist.LSApplicationQueriesSchemes.push('alipay');
    }

    if (!infoPlist.LSApplicationQueriesSchemes.includes('alipays')) {
      infoPlist.LSApplicationQueriesSchemes.push('alipays');
    }

    return config;
  });
};

/**
 * 添加 Android Manifest 配置
 */
const withAlipayAndroid: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    // 确保 queries 标签存在
    if (!androidManifest.queries) {
      androidManifest.queries = [{ package: [] }];
    }

    const queries = androidManifest.queries[0];

    // 添加支付宝 package
    if (!queries.package) {
      queries.package = [];
    }

    const alipayPackage = {
      $: { 'android:name': 'com.eg.android.AlipayGphone' },
    };

    const hasAlipayPackage = queries.package.some(
      (pkg: any) => pkg.$['android:name'] === 'com.eg.android.AlipayGphone'
    );

    if (!hasAlipayPackage) {
      queries.package.push(alipayPackage);
    }

    return config;
  });
};

/**
 * Expo Config Plugin for Alipay
 */
const withAlipay: ConfigPlugin<AlipayPluginProps> = (config, props = {}) => {
  const { scheme = 'alipay' } = props;

  config = withAlipayIOS(config, { scheme });
  config = withAlipayAndroid(config);

  return config;
};

export default withAlipay;
