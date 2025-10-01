# Install required dependencies
npm install @react-navigation/bottom-tabs @react-navigation/native-stack
npm install @react-native-async-storage/async-storage
npm install expo-auth-session expo-web-browser
npm install expo-image-picker expo-camera expo-sharing
npm install react-native-gesture-handler react-native-reanimated
npm install react-native-safe-area-context react-native-screens
npm install react-native-voice

# Create necessary directories
mkdir -Force src, src/components, src/screens, src/navigation, src/services, src/hooks, src/context, src/utils, src/assets, src/constants

# Create app.json configuration
@'
{
  "expo": {
    "name": "My Gallery",
    "slug": "my-gallery",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.anonymous.mygallery",
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them with your friends.",
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera"
        }
      ]
    ]
  }
}
'@ | Out-File -FilePath app.json -Encoding utf8

Write-Host "Setup complete! Run 'npx expo start' to start the development server."
