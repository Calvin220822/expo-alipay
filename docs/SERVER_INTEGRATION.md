# 服务端集成指南

本文档介绍如何在服务端生成支付宝订单信息和授权信息。

## 准备工作

1. 在 [支付宝开放平台](https://open.alipay.com/) 注册开发者账号
2. 创建应用并获取 App ID
3. 配置应用的公钥和私钥
4. 签约相关产品(App 支付、App 授权等)

## 生成订单信息

### Node.js 示例

```javascript
const crypto = require("crypto");

// 配置信息
const config = {
  appId: "2021001234567890",
  privateKey: "YOUR_PRIVATE_KEY", // 应用私钥
  alipayPublicKey: "ALIPAY_PUBLIC_KEY", // 支付宝公钥
  gateway: "https://openapi.alipay.com/gateway.do",
  signType: "RSA2",
};

// 生成订单信息
function generateOrderString(params) {
  const bizContent = {
    out_trade_no: params.orderId, // 商户订单号
    total_amount: params.amount, // 订单金额(元)
    subject: params.subject, // 订单标题
    product_code: "QUICK_MSECURITY_PAY",
    ...params.extra,
  };

  const requestParams = {
    app_id: config.appId,
    method: "alipay.trade.app.pay",
    charset: "utf-8",
    sign_type: config.signType,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    version: "1.0",
    biz_content: JSON.stringify(bizContent),
  };

  // 生成签名
  const sign = generateSign(requestParams, config.privateKey);
  requestParams.sign = sign;

  // 构建订单信息字符串
  return Object.keys(requestParams)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(requestParams[key])}`)
    .join("&");
}

// 生成签名
function generateSign(params, privateKey) {
  const sortedParams = Object.keys(params)
    .filter((key) => key !== "sign")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(sortedParams, "utf8");
  return sign.sign(privateKey, "base64");
}

// API 端点
app.post("/api/alipay/order", async (req, res) => {
  try {
    const { orderId, amount, subject } = req.body;

    // 验证参数
    if (!orderId || !amount || !subject) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // 生成订单信息
    const orderString = generateOrderString({
      orderId,
      amount: amount.toFixed(2),
      subject,
    });

    res.json({ orderString });
  } catch (error) {
    console.error("Generate order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

### Python 示例

```python
from datetime import datetime
from urllib.parse import quote
import json
import base64
from Crypto.Signature import PKCS1_v1_5
from Crypto.Hash import SHA256
from Crypto.PublicKey import RSA

# 配置信息
config = {
    'app_id': '2021001234567890',
    'private_key': 'YOUR_PRIVATE_KEY',
    'alipay_public_key': 'ALIPAY_PUBLIC_KEY',
    'gateway': 'https://openapi.alipay.com/gateway.do',
    'sign_type': 'RSA2',
}

def generate_sign(params, private_key):
    """生成签名"""
    sorted_params = sorted(
        [(k, v) for k, v in params.items() if k != 'sign'],
        key=lambda x: x[0]
    )
    unsigned_string = '&'.join([f'{k}={v}' for k, v in sorted_params])

    key = RSA.import_key(private_key)
    signer = PKCS1_v1_5.new(key)
    digest = SHA256.new(unsigned_string.encode('utf-8'))
    sign = signer.sign(digest)
    return base64.b64encode(sign).decode('utf-8')

def generate_order_string(params):
    """生成订单信息"""
    biz_content = {
        'out_trade_no': params['order_id'],
        'total_amount': params['amount'],
        'subject': params['subject'],
        'product_code': 'QUICK_MSECURITY_PAY',
    }

    request_params = {
        'app_id': config['app_id'],
        'method': 'alipay.trade.app.pay',
        'charset': 'utf-8',
        'sign_type': config['sign_type'],
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'version': '1.0',
        'biz_content': json.dumps(biz_content, separators=(',', ':')),
    }

    # 生成签名
    sign = generate_sign(request_params, config['private_key'])
    request_params['sign'] = sign

    # 构建订单信息字符串
    return '&'.join([
        f'{k}={quote(str(v))}'
        for k, v in sorted(request_params.items())
    ])

# Flask API 端点
@app.route('/api/alipay/order', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        amount = data.get('amount')
        subject = data.get('subject')

        if not all([order_id, amount, subject]):
            return jsonify({'error': 'Missing required parameters'}), 400

        order_string = generate_order_string({
            'order_id': order_id,
            'amount': f'{float(amount):.2f}',
            'subject': subject,
        })

        return jsonify({'order_string': order_string})
    except Exception as e:
        print(f'Generate order error: {e}')
        return jsonify({'error': 'Internal server error'}), 500
```

## 生成授权信息

### Node.js 示例

```javascript
// 生成授权信息
function generateAuthInfo(params) {
  const authParams = {
    apiname: "com.alipay.account.auth",
    app_id: config.appId,
    app_name: "mc",
    auth_type: "AUTHACCOUNT",
    biz_type: "openservice",
    method: "alipay.open.auth.sdk.code.get",
    pid: params.partnerId, // 合作伙伴ID
    product_id: "APP_FAST_LOGIN",
    scope: "kuaijie",
    sign_type: config.signType,
    target_id: new Date().getTime().toString(),
  };

  // 生成签名
  const sign = generateSign(authParams, config.privateKey);
  authParams.sign = sign;

  // 构建授权信息字符串
  return Object.keys(authParams)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(authParams[key])}`)
    .join("&");
}

// API 端点
app.post("/api/alipay/auth", async (req, res) => {
  try {
    const { partnerId } = req.body;

    if (!partnerId) {
      return res.status(400).json({ error: "Missing partner ID" });
    }

    const authInfo = generateAuthInfo({ partnerId });

    res.json({ authInfo });
  } catch (error) {
    console.error("Generate auth info error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

## 验证支付结果

客户端收到支付结果后,应该将结果发送到服务端进行验证:

```javascript
// 验证支付结果
function verifyPaymentResult(result) {
  const { sign, ...params } = result;

  // 构建待验证字符串
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  // 验证签名
  const verify = crypto.createVerify("RSA-SHA256");
  verify.update(sortedParams, "utf8");
  return verify.verify(config.alipayPublicKey, sign, "base64");
}

// API 端点
app.post("/api/alipay/verify", async (req, res) => {
  try {
    const { result } = req.body;

    // 验证签名
    const isValid = verifyPaymentResult(result);

    if (isValid) {
      // 更新订单状态
      // ...

      res.json({ success: true });
    } else {
      res.json({ success: false, error: "Invalid signature" });
    }
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

## 注意事项

1. **私钥安全**: 应用私钥必须保存在服务端,不能泄露给客户端
2. **金额格式**: 订单金额必须是字符串格式,保留两位小数
3. **订单号唯一**: 每个订单号必须唯一,不能重复使用
4. **异步通知**: 建议配置支付宝的异步通知 URL,以便及时获取支付结果
5. **签名验证**: 收到支付宝的回调时,必须验证签名的有效性

## 测试环境

支付宝提供沙箱环境用于测试:

- 沙箱网关: `https://openapi.alipaydev.com/gateway.do`
- 申请沙箱账号: https://opendocs.alipay.com/open/200/105311

## 相关文档

- [App 支付快速接入](https://opendocs.alipay.com/open/204/105051)
- [服务端 SDK](https://opendocs.alipay.com/open/54/103419)
- [签名验签](https://opendocs.alipay.com/open/291/106074)
- [异步通知](https://opendocs.alipay.com/open/204/105301)
