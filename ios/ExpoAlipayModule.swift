import ExpoModulesCore
import AlipaySDK
import os.log

public class ExpoAlipayModule: Module {
  private var alipayScheme: String = ""
  private var appId: String = ""
  private let logger = Logger(subsystem: "expo.modules.alipay", category: "ExpoAlipay")
  
  public func definition() -> ModuleDefinition {
    Name("ExpoAlipay")

    Function("setAlipayScheme") { (scheme: String) in
      self.alipayScheme = scheme
    }

    Function("setAppId") { (appId: String) in
      self.appId = appId
    }

    AsyncFunction("pay") { (orderString: String, promise: Promise) in
      self.logger.info("Starting payment with scheme: \(self.alipayScheme)")
      
      DispatchQueue.main.async {
        AlipaySDK.defaultService()?.payOrder(orderString, fromScheme: self.alipayScheme) { result in
          self.logger.info("Payment result received: \(String(describing: result))")
          
          guard let result = result as? [String: Any] else {
            self.logger.error("Invalid payment result type")
            promise.reject("E_ALIPAY_ERROR", "Invalid result from Alipay")
            return
          }
          
          var resultMap: [String: Any] = [:]
          resultMap["resultStatus"] = result["resultStatus"] ?? ""
          resultMap["result"] = result["result"] ?? ""
          resultMap["memo"] = result["memo"] ?? ""
          
          self.logger.info("Resolving payment promise with: \(resultMap)")
          promise.resolve(resultMap)
        }
      }
    }

    AsyncFunction("auth") { (authInfo: String, promise: Promise) in
      self.logger.info("Starting auth with scheme: \(self.alipayScheme)")
      
      DispatchQueue.main.async {
        AlipaySDK.defaultService()?.auth_V2(withInfo: authInfo, fromScheme: self.alipayScheme) { result in
          self.logger.info("Auth result received: \(String(describing: result))")
          
          guard let result = result as? [String: Any] else {
            self.logger.error("Invalid auth result type")
            promise.reject("E_ALIPAY_ERROR", "Invalid result from Alipay")
            return
          }
          
          var resultMap: [String: Any] = [:]
          resultMap["resultStatus"] = result["resultStatus"] ?? ""
          resultMap["result"] = result["result"] ?? ""
          resultMap["memo"] = result["memo"] ?? ""
          resultMap["resultCode"] = result["resultCode"] ?? ""
          resultMap["authCode"] = result["authCode"] ?? ""
          resultMap["alipayOpenId"] = result["alipayOpenId"] ?? ""
          
          self.logger.info("Resolving auth promise with: \(resultMap)")
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
