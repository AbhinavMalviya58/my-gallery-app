# My Gallery App

A comprehensive cross-platform React Native gallery application built with Expo SDK 54.x, featuring photo management, voice captions, and user authentication.

## 🎥 Demo Videos

### Web Version Demo
[📺 Web App Demonstration](https://drive.google.com/file/d/15EPlCg2aTP-JVCxVDreWyA27cWzZuXfM/view?usp=sharing)

### Mobile Version Demo  
[📱 Mobile App Demonstration](https://drive.google.com/file/d/1sgvMo8etuStNIJ_2XkaBSE8m-ba6tNdi/view?usp=sharing)

## ✨ Key Features

### 📸 Image Management
- **Camera Capture**: Take photos with full camera integration and permission handling
- **Gallery Selection**: Access device photo library with proper permissions
- **Image Display**: Responsive 2-column grid layout with smooth scrolling
- **Native Sharing**: Share images via platform-specific sharing APIs
- **Delete Functionality**: Remove images with confirmation dialogs

### 🎤 Voice Recording & Speech Recognition
- **Multi-Platform Support**: 
  - Native platforms: `@react-native-voice/voice` integration
  - Web: Web Speech API implementation
  - Universal fallback: Manual text input via prompts
- **Voice Notes**: Save voice captions as separate cards in gallery
- **Robust Error Handling**: Graceful degradation when voice features unavailable

### 🔐 Authentication System
- **Google OAuth**: Seamless authentication via Clerk integration
- **Protected Routes**: Conditional navigation based on authentication state
- **User Session Management**: Persistent login with secure token handling
- **Profile Integration**: Display user information and avatar

### 🌙 Advanced Theme System
- **Dark/Light Mode**: Toggle between themes with instant visual feedback
- **Persistent Storage**: Theme preference saved via AsyncStorage
- **Dynamic Colors**: All components adapt to current theme automatically
- **Smooth Transitions**: Animated theme switching across the entire app

### 💾 Data Persistence
- **Local Storage**: Gallery items stored in AsyncStorage with JSON serialization
- **User Preferences**: Theme and settings persistence
- **Offline Support**: Full functionality without internet connection
- **Data Integrity**: Error handling for storage operations

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- For mobile development: Expo Go app or development build

### Installation

1. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Set up environment variables**
```bash
# Create .env file with your Clerk publishable key
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
```

3. **Start the development server**
```bash
expo start
```

### Platform-Specific Commands
```bash
expo run:android    # Run on Android device/emulator
expo run:ios        # Run on iOS device/simulator  
expo start --web    # Run in web browser
```

## 🏗️ Technical Architecture

### Core Dependencies
```json
{
  "react-native": "0.81.4",
  "expo": "~54.0.10",
  "@clerk/clerk-expo": "^2.15.4",
  "expo-image-picker": "~17.0.8",
  "@react-native-voice/voice": "^3.2.4",
  "@react-navigation/bottom-tabs": "^7.2.0",
  "@react-navigation/native-stack": "^7.3.26",
  "@react-native-async-storage/async-storage": "2.2.0"
}
```

### Project Structure
```
src/
├── screens/
│   ├── GalleryScreen.tsx        # Main interface (1066 lines)
│   ├── SettingsScreen.tsx       # User preferences & theme toggle
│   ├── AddItemScreen.tsx        # Simplified (functionality moved to Gallery)
│   └── auth/
│       └── LoginScreen.tsx      # Google OAuth authentication
├── context/
│   ├── ThemeContext.tsx         # Global theme state management
│   └── AuthContext.tsx          # User authentication context
├── navigation/
│   └── AppNavigator.tsx         # Tab navigation & route protection
├── utils/
│   ├── notifications.ts         # Local notification handling
│   └── share.ts                 # Cross-platform sharing utilities
└── components/                  # Reusable UI components
```

## 🔧 Key Implementation Details

### Image Picker Integration
```typescript
const pickImage = async () => {
  // Comprehensive permission handling
  const hasPermission = await requestPermissions();
  
  // Image library access with fallback options
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });
  
  // Save to gallery with automatic caption
  if (!result.canceled) {
    await saveGalleryItem(result.assets[0].uri, 'New Image');
  }
};
```

### Voice Recording System
```typescript
const toggleRecording = async () => {
  if (Platform.OS === 'web') {
    // Web Speech API implementation
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    // ... implementation
  } else {
    // Native voice recognition with fallbacks
    if (voiceAvailable && Voice) {
      await Voice.start('en-US');
    } else {
      // Manual text input fallback
      Alert.prompt('Add Voice Note', 'Type your note:');
    }
  }
};
```

### Data Management
```typescript
type GalleryItem = {
  id: string;
  uri: string;
  caption: string;
  createdAt: number;
  userId: string;
  type: 'image' | 'voice_caption';
};

// AsyncStorage operations with error handling
const saveGalleryItem = async (uri: string, caption: string) => {
  try {
    const newItem: GalleryItem = { /* ... */ };
    const updatedItems = [...galleryItems, newItem];
    await AsyncStorage.setItem('galleryItems', JSON.stringify(updatedItems));
    setGalleryItems(updatedItems);
  } catch (error) {
    Alert.alert('Error', 'Failed to save gallery item');
  }
};
```

## 🎨 UI/UX Features

### Modern Interface Design
- **Material Design**: Floating action buttons and card-based layouts
- **Responsive Grid**: Adaptive 2-column gallery layout
- **Loading States**: Smooth loading indicators and empty states
- **Confirmation Dialogs**: User-friendly confirmation for destructive actions

### Accessibility & Usability
- **Permission Handling**: Clear permission requests with explanatory messages
- **Error Recovery**: Graceful error handling with user-friendly messages
- **Cross-Platform UX**: Consistent experience across all platforms
- **Offline Functionality**: Full app functionality without internet connection

## 📱 Platform Support

### iOS
- Native camera and photo library integration
- Voice recognition via React Native Voice
- Native sharing and notifications
- Smooth animations and transitions

### Android
- Comprehensive permission handling
- Camera and storage access
- Voice recognition with fallbacks
- Material Design components

### Web
- Photo library picker functionality
- Web Speech API for voice recognition
- Web Share API with fallbacks
- Responsive design for desktop/mobile browsers

## 🔒 Security & Privacy

### Permission Management
- **Camera**: Required for photo capture
- **Microphone**: Required for voice recording
- **Photo Library**: Required for image selection
- **Notifications**: Optional for image addition alerts

### Data Security
- **Local Storage**: All data stored locally on device
- **Secure Authentication**: OAuth tokens managed by Clerk
- **No Cloud Storage**: Images remain on user's device
- **Privacy First**: No data collection or tracking

## 🚀 Deployment & Distribution

### Development Build
```bash
eas build --platform android --profile development
eas build --platform ios --profile development
```

### Production Build
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Web Deployment
```bash
expo export --platform web
# Deploy static files to your preferred hosting service
```

## 📝 Configuration Files

### app.json
```json
{
  "expo": {
    "name": "my-gallery-app",
    "slug": "my-gallery-app",
    "scheme": "mygalleryapp",
    "bundleIdentifier": "com.abhinav58.mygalleryapp",
    "plugins": [
      "expo-image-picker",
      "expo-notifications",
      "expo-secure-store",
      "expo-web-browser"
    ]
  }
}
```

### Environment Variables
```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## 🔧 Development Notes

### Voice Recognition Setup
- Voice dictation requires microphone permission
- Web version uses Web Speech API when available
- Native platforms use @react-native-voice/voice
- Manual text input serves as universal fallback

### Theme System
- Themes persist across app restarts via AsyncStorage
- Dynamic color schemes affect all components
- Smooth transitions between light and dark modes

### Error Handling
- Comprehensive try-catch blocks throughout async operations
- User-friendly error messages via Alert dialogs
- Graceful degradation for unsupported platform features

### Performance Optimizations
- Efficient FlatList rendering for large image collections
- Optimized image loading and caching
- Minimal re-renders with proper React hooks usage

## 🐛 Troubleshooting

### Common Issues
1. **Voice recognition not working**: Check microphone permissions and device compatibility
2. **Images not loading**: Verify camera/photo library permissions
3. **Theme not persisting**: Clear AsyncStorage and restart app
4. **Build errors**: Run `expo install` to align dependency versions

### Platform-Specific Notes
- **Android**: Requires explicit permission requests for camera and microphone
- **iOS**: Permissions handled automatically by Expo plugins
- **Web**: Some features may have limited browser support

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Built with ❤️ using React Native, Expo, and modern mobile development practices.**
