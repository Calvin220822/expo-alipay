package expo.modules.alipay

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.text.TextUtils
import com.alipay.sdk.app.PayTask
import com.alipay.sdk.app.AuthTask
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.util.concurrent.Executors

class ExpoAlipayModule : Module() {
  private val executor = Executors.newSingleThreadExecutor()
  private val mainHandler = Handler(Looper.getMainLooper())
  private var appId: String? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoAlipay")

    Function("setAlipayScheme") { scheme: String ->
      // Android 不需要设置 scheme
    }

    Function("setAppId") { appId: String ->
      this@ExpoAlipayModule.appId = appId
    }

    AsyncFunction("pay") { orderString: String, promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity
      if (activity == null) {
        promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist", null)
        return@AsyncFunction
      }

      executor.execute {
        try {
          val payTask = PayTask(activity)
          val result = payTask.payV2(orderString, true)
          
          mainHandler.post {
            val resultMap = mutableMapOf<String, Any?>()
            resultMap["resultStatus"] = result["resultStatus"]
            resultMap["result"] = result["result"]
            resultMap["memo"] = result["memo"]
            
            promise.resolve(resultMap)
          }
        } catch (e: Exception) {
          mainHandler.post {
            promise.reject("E_ALIPAY_ERROR", e.message, e)
          }
        }
      }
    }

    AsyncFunction("auth") { authInfo: String, promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity
      if (activity == null) {
        promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist", null)
        return@AsyncFunction
      }

      executor.execute {
        try {
          val authTask = AuthTask(activity)
          val result = authTask.authV2(authInfo, true)
          
          mainHandler.post {
            val resultMap = mutableMapOf<String, Any?>()
            resultMap["resultStatus"] = result["resultStatus"]
            resultMap["result"] = result["result"]
            resultMap["memo"] = result["memo"]
            resultMap["resultCode"] = result["resultCode"]
            resultMap["authCode"] = result["authCode"]
            resultMap["alipayOpenId"] = result["alipayOpenId"]
            
            promise.resolve(resultMap)
          }
        } catch (e: Exception) {
          mainHandler.post {
            promise.reject("E_ALIPAY_ERROR", e.message, e)
          }
        }
      }
    }

    AsyncFunction("isAlipayInstalled") { promise: Promise ->
      try {
        val context = appContext.reactContext
        val packageManager = context?.packageManager
        var isInstalled = false
        
        try {
          packageManager?.getPackageInfo("com.eg.android.AlipayGphone", 0)
          isInstalled = true
        } catch (e: Exception) {
          isInstalled = false
        }
        
        promise.resolve(isInstalled)
      } catch (e: Exception) {
        promise.reject("E_ALIPAY_ERROR", e.message, e)
      }
    }
  }
}
