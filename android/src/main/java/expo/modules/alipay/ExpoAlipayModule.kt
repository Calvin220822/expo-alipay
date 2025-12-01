package expo.modules.alipay

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.text.TextUtils
import android.util.Log
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
          // payV2 必须在子线程中调用，第二个参数 true 表示显示加载框
          val result: Map<String, String> = payTask.payV2(orderString, true)
          
          Log.i("ExpoAlipay", "Payment result: $result")
          
          mainHandler.post {
            // 将 Map<String, String> 转换为适合 Promise 的格式
            val resultMap = mutableMapOf<String, Any?>()
            resultMap["resultStatus"] = result["resultStatus"] ?: ""
            resultMap["result"] = result["result"] ?: ""
            resultMap["memo"] = result["memo"] ?: ""
            
            Log.i("ExpoAlipay", "Resolving payment promise with: $resultMap")
            promise.resolve(resultMap)
          }
        } catch (e: Exception) {
          Log.e("ExpoAlipay", "Payment error: ${e.message}", e)
          mainHandler.post {
            promise.reject("E_ALIPAY_ERROR", e.message ?: "Payment failed", e)
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
          // authV2 必须在子线程中调用，第二个参数 true 表示显示加载框
          val result: Map<String, String> = authTask.authV2(authInfo, true)
          
          Log.i("ExpoAlipay", "Auth result: $result")
          
          mainHandler.post {
            // 将 Map<String, String> 转换为适合 Promise 的格式
            val resultMap = mutableMapOf<String, Any?>()
            resultMap["resultStatus"] = result["resultStatus"] ?: ""
            resultMap["result"] = result["result"] ?: ""
            resultMap["memo"] = result["memo"] ?: ""
            resultMap["resultCode"] = result["resultCode"] ?: ""
            resultMap["authCode"] = result["authCode"] ?: ""
            resultMap["alipayOpenId"] = result["alipayOpenId"] ?: ""
            
            Log.i("ExpoAlipay", "Resolving auth promise with: $resultMap")
            promise.resolve(resultMap)
          }
        } catch (e: Exception) {
          Log.e("ExpoAlipay", "Auth error: ${e.message}", e)
          mainHandler.post {
            promise.reject("E_ALIPAY_ERROR", e.message ?: "Auth failed", e)
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
