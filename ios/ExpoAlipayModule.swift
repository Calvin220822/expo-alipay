import ExpoModulesCore
import AlipaySDK

public class ExpoAlipayModule: Module {
  private var alipayScheme: String = ""
  private var appId: String = ""
  
  public func definition() -> ModuleDefinition {
    Name("ExpoAlipay")

    Function("setAlipayScheme") { (scheme: String) in
      self.alipayScheme = scheme
    }

    Function("setAppId") { (appId: String) in
      self.appId = appId
    }

    AsyncFunction("pay") { (orderString: String, promise: Promise) in
      DispatchQueue.main.async {
        AlipaySDK.defaultService()?.payOrder(orderString, fromScheme: self.alipayScheme) { result in
          guard let result = result as? [String: Any] else {
            promise.reject("E_ALIPAY_ERROR", "Invalid result from Alipay")
            return
          }
          
          var resultMap: [String: Any] = [:]
          resultMap["resultStatus"] = result["resultStatus"] ?? ""
          resultMap["result"] = result["result"]
          resultMap["memo"] = result["memo"]
          
          promise.resolve(resultMap)
        }
      }
    }

    AsyncFunction("auth") { (authInfo: String, promise: Promise) in
      DispatchQueue.main.async {
        AlipaySDK.defaultService()?.auth_V2(withInfo: authInfo, fromScheme: self.alipayScheme) { result in
          guard let result = result as? [String: Any] else {
            promise.reject("E_ALIPAY_ERROR", "Invalid result from Alipay")
            return
          }
          
          var resultMap: [String: Any] = [:]
          resultMap["resultStatus"] = result["resultStatus"] ?? ""
          resultMap["result"] = result["result"]
          resultMap["memo"] = result["memo"]
          resultMap["resultCode"] = result["resultCode"]
          resultMap["authCode"] = result["authCode"]
          resultMap["alipayOpenId"] = result["alipayOpenId"]
          
          promise.resolve(resultMap)
        }
      }
    }

    AsyncFunction("isAlipayInstalled") { (promise: Promise) in
      let isInstalled = UIApplication.shared.canOpenURL(URL(string: "alipay://")!)
      promise.resolve(isInstalled)
    }
  }
}
