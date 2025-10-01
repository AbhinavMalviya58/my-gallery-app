# Install dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install @react-native-async-storage/async-storage
npm install expo-auth-session expo-web-browser expo-linking
npm install expo-image-picker expo-camera expo-sharing expo-file-system
npm install react-native-gesture-handler react-native-reanimated
npm install react-native-safe-area-context react-native-screens
npm install @react-native-voice/voice
npm install @expo/vector-icons

# Create necessary directories
mkdir -Force src/components
mkdir -Force src/screens
mkdir -Force src/navigation
mkdir -Force src/context
mkdir -Force src/hooks
mkdir -Force src/utils
mkdir -Force src/assets
mkdir -Force src/constants

Write-Host "✅ Setup complete! Next steps:"
Write-Host "1. Configure your Google OAuth credentials:"
Write-Host "   - Go to Google Cloud Console (https://console.cloud.google.com/)"
Write-Host "   - Create a new project"
Write-Host "   - Enable Google Sign-In API"
Write-Host "   - Create OAuth 2.0 Client IDs for Android and Web"
Write-Host "   - Update the CLIENT_ID in src/context/AuthContext.tsx"
Write-Host "2. Run the app:"
Write-Host "   - For Android: npx expo run:android"
Write-Host "   - For Web: npx expo start --web"
Write-Host "   - (Optional) Install Expo Go on your Android device for easier development"
