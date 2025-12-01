# expo-alipay

Expo 支付宝 SDK 集成模块,支持 iOS 和 Android 平台。

## 功能特性

- ✅ 支付宝支付
- ✅ 支付宝授权
- ✅ 检查支付宝是否已安装
- ✅ 自动配置(通过 Config Plugin)
- ✅ TypeScript 支持
- ✅ iOS & Android 原生支持

## 安装

```bash
npm install @jayming/expo-alipay
# 或
yarn add @jayming/expo-alipay
# 或
pnpm add @jayming/expo-alipay
```

## 配置

### 1. 在 `app.json` 中添加 Config Plugin

```json
{
  "expo": {
    "plugins": [
      [
        "@jayming/expo-alipay",
        {
          "scheme": "your-app-scheme"
        }
      ]
    ]
  }
}
```

> **注意**: Config Plugin 会自动配置 iOS 的 AppDelegate 和 Android 的 Manifest,无需手动修改原生代码。

### 2. 重新构建应用

```bash
npx expo prebuild
npx expo run:ios
# 或
npx expo run:android
```

## 使用方法

### 基本使用

```typescript
import * as ExpoAlipay from '@jayming/expo-alipay';

// 1. 设置 URL Scheme (iOS 必需)
ExpoAlipay.setAlipayScheme('your-app-scheme');

// 2. 设置 App ID
ExpoAlipay.setAppId('your-alipay-app-id');

// 3. 检查支付宝是否已安装
const isInstalled = await ExpoAlipay.isAlipayInstalled();
console.log('支付宝已安装:', isInstalled);

// 4. 发起支付
try {
  const orderString = 'order_string_from_server'; // 从服务器获取
  const result = await ExpoAlipay.pay(orderString);

  console.log('支付结果:', result);

  if (result.resultStatus === '9000') {
    console.log('支付成功');
  } else if (result.resultStatus === '6001') {
    console.log('用户取消支付');
  } else {
    console.log('支付失败:', result.memo);
  }
} catch (error) {
  console.error('支付错误:', error);
}

// 5. 发起授权
try {
  const authInfo = 'auth_info_from_server'; // 从服务器获取
  const result = await ExpoAlipay.auth(authInfo);

  console.log('授权结果:', result);

  if (result.resultStatus === '9000') {
    console.log('授权成功');
    console.log('授权码:', result.authCode);
  } else {
    console.log('授权失败:', result.memo);
  }
} catch (error) {
  console.error('授权错误:', error);
}
```

### 完整示例

```typescript
import React, { useState, useEffect } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import * as ExpoAlipay from '@jayming/expo-alipay';

export default function PaymentScreen() {
  const [isAlipayInstalled, setIsAlipayInstalled] = useState(false);

  useEffect(() => {
    // 初始化
    ExpoAlipay.setAlipayScheme('myapp'); // 替换为你的 scheme
    ExpoAlipay.setAppId('2021001234567890'); // 替换为你的 App ID

    // 检查支付宝是否已安装
    checkAlipayInstalled();
  }, []);

  const checkAlipayInstalled = async () => {
    const installed = await ExpoAlipay.isAlipayInstalled();
    setIsAlipayInstalled(installed);
  };

  const handlePay = async () => {
    try {
      // 1. 从服务器获取订单信息
      const orderString = await fetchOrderFromServer();

      // 2. 调用支付
      const result = await ExpoAlipay.pay(orderString);

      // 3. 处理支付结果
      if (result.resultStatus === '9000') {
        Alert.alert('成功', '支付成功');
      } else if (result.resultStatus === '6001') {
        Alert.alert('取消', '用户取消支付');
      } else {
        Alert.alert('失败', result.memo || '支付失败');
      }
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };

  const handleAuth = async () => {
    try {
      // 1. 从服务器获取授权信息
      const authInfo = await fetchAuthInfoFromServer();

      // 2. 调用授权
      const result = await ExpoAlipay.auth(authInfo);

      // 3. 处理授权结果
      if (result.resultStatus === '9000') {
        Alert.alert('成功', `授权成功\n授权码: ${result.authCode}`);
        // 将 authCode 发送到服务器换取用户信息
      } else {
        Alert.alert('失败', result.memo || '授权失败');
      }
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>支付宝状态: {isAlipayInstalled ? '已安装' : '未安装'}</Text>
      <Button title="发起支付" onPress={handlePay} />
      <Button title="发起授权" onPress={handleAuth} />
    </View>
  );
}

// 模拟从服务器获取订单信息
async function fetchOrderFromServer() {
  // 实际项目中应该从服务器获取
  // 订单信息格式参考: https://opendocs.alipay.com/open/204/105465
  const response = await fetch('https://your-api.com/alipay/order', {
    method: 'POST',
    // ... 其他参数
  });
  const data = await response.json();
  return data.orderString;
}

// 模拟从服务器获取授权信息
async function fetchAuthInfoFromServer() {
  // 实际项目中应该从服务器获取
  // 授权信息格式参考: https://opendocs.alipay.com/open/218/105327
  const response = await fetch('https://your-api.com/alipay/auth', {
    method: 'POST',
    // ... 其他参数
  });
  const data = await response.json();
  return data.authInfo;
}
```

## API 文档

### `setAlipayScheme(scheme: string): void`

设置支付宝的 URL Scheme (iOS 必需)。

**参数:**

- `scheme`: URL Scheme,需要与 `app.json` 中配置的一致

### `setAppId(appId: string): void`

设置支付宝的 App ID。

**参数:**

- `appId`: 支付宝开放平台申请的 App ID

### `pay(orderString: string): Promise<AlipayPaymentResult>`

发起支付宝支付。

**参数:**

- `orderString`: 订单信息字符串(从服务端获取)

**返回值:**

```typescript
interface AlipayPaymentResult {
  resultStatus: string; // 结果状态码
  result?: string; // 结果详情
  memo?: string; // 结果描述
}
```

**常见状态码:**

- `9000`: 支付成功
- `8000`: 正在处理中
- `4000`: 订单支付失败
- `5000`: 重复请求
- `6001`: 用户中途取消
- `6002`: 网络连接出错
- `6004`: 支付结果未知

### `auth(authInfo: string): Promise<AlipayAuthResult>`

发起支付宝授权。

**参数:**

- `authInfo`: 授权信息字符串(从服务端获取)

**返回值:**

```typescript
interface AlipayAuthResult {
  resultStatus: string; // 结果状态码
  result?: string; // 结果详情
  memo?: string; // 结果描述
  resultCode?: string; // 结果码
  authCode?: string; // 授权码
  alipayOpenId?: string; // 支付宝用户 ID
}
```

### `isAlipayInstalled(): Promise<boolean>`

检查支付宝是否已安装。

**返回值:**

- `Promise<boolean>`: 是否已安装支付宝

## 常见问题

### 1. iOS 支付后没有回调?

确保 `app.json` 中配置的 scheme 与代码中 `setAlipayScheme()` 设置的一致,并在修改配置后重新运行 `npx expo prebuild`。

### 2. Android 找不到支付宝应用?

Config Plugin 会自动在 `AndroidManifest.xml` 中添加 `queries` 配置,确保在添加 plugin 后重新运行 `npx expo prebuild`。

### 3. 订单信息从哪里获取?

订单信息和授权信息都必须从服务器生成,不能在客户端生成。参考:

- 支付订单: https://opendocs.alipay.com/open/204/105465
- 授权信息: https://opendocs.alipay.com/open/218/105327

### 4. 如何测试?

支付宝提供了沙箱环境用于测试。申请沙箱账号:
https://opendocs.alipay.com/open/200/105311

## 许可证

MIT

## 相关链接

- [支付宝开放平台](https://open.alipay.com/)
- [Android SDK 集成文档](https://opendocs.alipay.com/open/00dn75)
- [iOS SDK 集成文档](https://opendocs.alipay.com/open/00dn76)
- [App 支付接口文档](https://opendocs.alipay.com/open/204/105465)
- [App 授权接口文档](https://opendocs.alipay.com/open/218/105327)
