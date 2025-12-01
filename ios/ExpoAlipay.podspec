Pod::Spec.new do |s|
  s.name           = 'ExpoAlipay'
  s.version        = '1.0.0'
  s.summary        = 'Expo module for Alipay SDK integration'
  s.description    = 'Expo module for Alipay SDK integration on iOS and Android'
  s.author         = { 'jayming' => '' }
  s.homepage       = 'https://github.com/WangJM001/expo-alipay'
  s.license        = 'MIT'
  s.platforms      = { :ios => '13.0', :tvos => '13.0' }
  s.source         = { :git => 'https://github.com/WangJM001/expo-alipay.git', :tag => s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Alipay SDK
  s.dependency 'AlipaySDK-iOS', '~> 15.8.16'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
