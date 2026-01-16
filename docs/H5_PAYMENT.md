# 手机网站转 APP 支付（H5 支付）使用指南

## 功能说明

手机网站转 APP 支付（也称为 H5 支付）允许用户从手机网页直接跳转到支付宝 APP 完成支付，支付完成后返回到您的 APP。

本功能适用于在 WebView 中加载 H5 页面进行支付的场景。

## 使用步骤

### 1. 在服务端生成 H5 支付 URL

您需要在服务端使用支付宝 H5 支付接口生成支付 URL：

```javascript
// 服务端示例 (Node.js)
const AlipaySdk = require('alipay-sdk').default;

const alipaySdk = new AlipaySdk({
  appId: 'YOUR_APP_ID',
  privateKey: 'YOUR_PRIVATE_KEY',
  alipayPublicKey: 'ALIPAY_PUBLIC_KEY',
});

// 生成H5支付URL
const result = await alipaySdk.exec('alipay.trade.wap.pay', {
  notify_url: 'https://your-server.com/alipay/notify',
  return_url: 'https://your-app.com/alipay/return',
  bizContent: {
    out_trade_no: '订单号',
    total_amount: '0.01',
    subject: '商品标题',
    product_code: 'QUICK_WAP_WAY',
  },
});

// result 是一个包含 HTML form 的字符串
// 您需要部署这个页面，或从中提取支付 URL
return result;
```

### 2. 在 WebView 中拦截支付 URL

在您的 React Native / Expo 应用中使用 WebView 加载 H5 页面，并拦截支付宝支付 URL：

```typescript
import React, { useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import * as ExpoAlipay from 'expo-alipay';

export default function H5PaymentScreen() {
  const webviewRef = useRef(null);

  useEffect(() => {
    // 初始化配置（在应用启动时调用一次）
    ExpoAlipay.setAlipayScheme('your-app-scheme'); // iOS需要

    // 监听支付结果事件
    const subscription = ExpoAlipay.addListener('onH5PayResult', (result) => {
      console.log('H5支付结果:', result);

      // resultStatus 说明：
      // "9000" - 支付成功
      // "8000" - 正在处理中
      // "4000" - 支付失败
      // "6001" - 用户取消
      // "6002" - 网络连接出错

      if (result.resultStatus === '9000') {
        console.log('支付成功！');
        // 如果有 returnUrl，让 WebView 加载这个 URL
        if (result.returnUrl) {
          webviewRef.current?.injectJavaScript(`
            window.location.href = "${result.returnUrl}";
          `);
        }
      } else if (result.resultStatus === '6001') {
        console.log('用户取消支付');
      } else {
        console.log('支付失败:', result.memo);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;

    // 拦截支付宝支付 URL
    // 如果是支付宝 URL，会自动调起支付宝 APP
    // 支付结果通过 onH5PayResult 事件返回
    const isIntercepted = ExpoAlipay.payInterceptorWithUrl(url);

    // 返回值说明：
    // true - URL 已被拦截，WebView 不应该继续加载
    // false - URL 未被拦截，WebView 应该继续加载
    return !isIntercepted; // WebView 的逻辑：true=继续加载，false=拦截
  };

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: 'https://your-h5-payment-page.com' }}
      onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
      // Android 需要这个属性
      onNavigationStateChange={(navState) => {
        if (navState.url) {
          const isIntercepted = ExpoAlipay.payInterceptorWithUrl(navState.url);
          if (isIntercepted) {
            // URL 被拦截，阻止 WebView 加载
            webviewRef.current?.stopLoading();
          }
        }
      }}
    />
  );
}
```

### 3. 完整示例（带状态管理）

```typescript
import React, { useRef, useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ExpoAlipay from 'expo-alipay';

export default function H5PaymentScreen({ route }) {
  const webviewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const { paymentUrl } = route.params; // 从服务端获取的 H5 支付页面 URL

  useEffect(() => {
    // 初始化配置
    ExpoAlipay.setAlipayScheme('your-app-scheme');

    // 监听支付结果
    const subscription = ExpoAlipay.addListener('onH5PayResult', async (result) => {
      console.log('支付结果:', result);

      if (result.resultStatus === '9000') {
        Alert.alert('成功', '支付成功！');

        // 如果有 returnUrl，让 WebView 加载这个 URL
        if (result.returnUrl) {
          webviewRef.current?.injectJavaScript(`
            window.location.href = "${result.returnUrl}";
          `);
        }

        // 建议：调用服务端接口验证订单状态
        await verifyOrder(result);
      } else if (result.resultStatus === '6001') {
        Alert.alert('提示', '已取消支付');
      } else {
        Alert.alert('失败', result.memo || '支付失败');
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const verifyOrder = async (paymentResult) => {
    try {
      await fetch('https://your-api.com/verify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: paymentResult }),
      });
    } catch (error) {
      console.error('验证订单失败:', error);
    }
  };

  const handleShouldStartLoadWithRequest = (request) => {
    const isIntercepted = ExpoAlipay.payInterceptorWithUrl(request.url);
    return !isIntercepted;
  };

  const handleNavigationStateChange = (navState) => {
    if (navState.url) {
      const isIntercepted = ExpoAlipay.payInterceptorWithUrl(navState.url);
      if (isIntercepted) {
        webviewRef.current?.stopLoading();
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        source={{ uri: paymentUrl }}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}
```

## API 参考

### `payInterceptorWithUrl(url: string): boolean`

拦截 WebView 中的支付宝 H5 支付 URL，自动调起支付宝 APP 完成支付。

**特性：**

- **同步方法**：立即返回拦截结果
- **事件驱动**：支付结果通过 `onH5PayResult` 事件异步返回

**参数:**

- `url`: 当前 WebView 要加载的 URL

**返回值:**

- `true`: URL 已被拦截（是支付宝支付 URL），WebView 不应该继续加载
- `false`: URL 未被拦截（不是支付宝支付 URL），WebView 应该继续加载

**支付结果事件:**

通过 `ExpoAlipay.addListener('onH5PayResult', callback)` 监听支付结果：

```typescript
interface AlipayH5PaymentResult {
  resultStatus: string; // 支付结果状态码
  memo?: string; // 结果描述
  returnUrl?: string; // 支付完成后应该跳转的 URL
}
```

**resultStatus 状态码:**

- `9000`: 支付成功
- `8000`: 正在处理中（支付结果未知，需查询订单状态）
- `4000`: 支付失败
- `6001`: 用户取消支付
- `6002`: 网络连接出错
- `6004`: 支付结果未知（可能成功也可能失败，需查询订单状态）

## 与普通 APP 支付的区别

| 特性       | APP 支付 (`pay`)        | H5 支付 (`payInterceptorWithUrl`) |
| ---------- | ----------------------- | --------------------------------- |
| 使用场景   | 原生 APP 内直接调起支付 | WebView 中拦截 H5 支付 URL        |
| 调用方式   | 异步 Promise            | 同步返回 + 事件监听               |
| 服务端接口 | `alipay.trade.app.pay`  | `alipay.trade.wap.pay`            |
| 参数格式   | 订单字符串              | WebView 的 URL                    |
| 返回方式   | Promise resolve         | Event 事件回调                    |
| 适用产品   | APP 支付产品            | 手机网站支付产品                  |

## 注意事项

1. **URL 拦截时机**: 必须在 WebView 的 URL 变化时调用 `payInterceptorWithUrl`，不能提前或延后
2. **事件监听**: 必须在调用拦截方法前先设置事件监听器，否则可能收不到支付结果
3. **安全性**: 永远在服务端生成订单，不要在客户端拼接支付参数
4. **验证**: 支付完成后必须调用后端接口验证订单状态，不要仅依赖客户端返回结果
5. **异步通知**: 配置支付宝异步通知 URL，处理支付成功的服务端回调
6. **URL Scheme**: iOS 需要正确配置 URL Scheme 才能接收支付回调
7. **支付宝安装**: 可以使用 `isAlipayInstalled()` 检查用户是否安装了支付宝 APP
8. **returnUrl 处理**: 如果支付结果中有 `returnUrl`，应该让 WebView 加载这个 URL 以显示支付结果页面

## 跨平台差异

- **iOS**: 使用 `onShouldStartLoadWithRequest` 拦截 URL
- **Android**: 使用 `onNavigationStateChange` 拦截 URL，并需要调用 `stopLoading()` 阻止加载

## 常见问题

### Q: 为什么改成同步方法 + 事件监听？

A: 这是为了符合支付宝官方的 WebView 拦截模式。在 WebView 的 URL 拦截回调中，需要同步返回是否拦截该 URL，而支付结果是异步的，所以通过事件返回。

### Q: returnUrl 有什么作用？

A: 支付宝支付完成后，会返回商户配置的 return_url。您应该让 WebView 加载这个 URL，以便显示支付结果页面或商户的回调页面。

### Q: 如何处理支付失败或取消？

A: 监听 `onH5PayResult` 事件，根据 `resultStatus` 判断支付状态，并给用户相应的提示。

## 技术支持

如有问题，请访问：

- [支付宝开放平台文档](https://opendocs.alipay.com/open/204/105695)
- [GitHub Issues](https://github.com/your-repo/expo-alipay/issues)

## 错误处理

```typescript
try {
  const result = await ExpoAlipay.payInterceptorWithUrl(payForm);
  // 处理结果...
} catch (error) {
  if (error.code === 'E_ACTIVITY_DOES_NOT_EXIST') {
    console.error('Activity不存在');
  } else if (error.code === 'E_ALIPAY_ERROR') {
    console.error('支付宝错误:', error.message);
  } else {
    console.error('未知错误:', error);
  }
}
```

## 测试

### 测试环境配置

1. 使用支付宝沙箱环境进行测试
2. 配置沙箱账号和密钥
3. 使用沙箱版支付宝 APP

### 测试订单

```javascript
// 服务端生成测试订单
const testOrder = {
  out_trade_no: 'TEST_' + Date.now(),
  total_amount: '0.01', // 沙箱环境可以用很小的金额
  subject: '测试商品',
  product_code: 'QUICK_WAP_WAY',
};
```

## 相关文档

- [支付宝开放平台文档](https://opendocs.alipay.com/open/204/105051)
- [手机网站支付产品介绍](https://opendocs.alipay.com/open/203)
- [服务端集成指南](./SERVER_INTEGRATION.md)
