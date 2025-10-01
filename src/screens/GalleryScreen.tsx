import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform, 
  StyleSheet, 
  ImageStyle, 
  ViewStyle, 
  TextStyle,
  Alert,
  PermissionsAndroid,
  SafeAreaView,
  TextInput
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
// Voice functionality with complete error handling
let Voice: any = null;
let voiceAvailable = false;

const initializeVoice = () => {
  try {
    Voice = require('@react-native-voice/voice').default;
    console.log('Voice object after require:', Voice);
    console.log('Voice type:', typeof Voice);
    
    if (Voice && typeof Voice === 'object') {
      console.log('Voice methods available:', Object.keys(Voice));
      voiceAvailable = true;
      console.log('Voice module loaded successfully');
    } else {
      console.log('Voice module loaded but invalid');
      voiceAvailable = false;
    }
  } catch (error) {
    console.log('Voice module not available:', error);
    voiceAvailable = false;
    Voice = null;
  }
};

// Initialize voice on module load
initializeVoice();

// Types
type RootStackParamList = {
  Gallery: undefined;
  // Add other routes here if needed
};

type GalleryItem = {
  id: string;
  uri: string;
  caption: string;
  createdAt: number;
  userId: string;
  type: 'image' | 'voice_caption';
};

type GalleryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Gallery'>;
type GalleryScreenRouteProp = RouteProp<RootStackParamList, 'Gallery'>;

// Extend FileSystem type with the properties we need
interface CustomFileSystem extends FileSystem.FileSystemSessionType {
  documentDirectory: string | null;
  cacheDirectory: string | null;
  downloadAsync(uri: string, fileUri: string, options?: any): Promise<FileSystem.FileSystemDownloadResult>;
  makeDirectoryAsync(fileUri: string, options?: { intermediates: boolean }): Promise<void>;
  getInfoAsync(fileUri: string, options?: { md5?: boolean; size?: boolean }): Promise<FileSystem.FileInfo>;
  writeAsStringAsync(fileUri: string, contents: string, options?: FileSystem.WritingOptions): Promise<void>;
  readAsStringAsync(fileUri: string, options?: FileSystem.ReadingOptions): Promise<string>;
  deleteAsync(fileUri: string, options?: { idempotent: boolean }): Promise<void>;
  moveAsync(options: { from: string; to: string }): Promise<void>;
  copyAsync(options: { from: string; to: string }): Promise<void>;
}

const customFileSystem = FileSystem as unknown as CustomFileSystem;

// Main Component
const GalleryScreen: React.FC = () => {
  // Navigation
  const navigation = useNavigation<GalleryScreenNavigationProp>();
  const route = useRoute<GalleryScreenRouteProp>();
  
  // State
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<boolean>(false);
  
  // Auth & Theme
  const { user } = useUser();
  const { colors } = useTheme();

  // Load gallery items
  const loadGalleryItems = useCallback(async () => {
    try {
      const itemsJson = await AsyncStorage.getItem('galleryItems');
      if (itemsJson) {
        const items = JSON.parse(itemsJson);
        setGalleryItems(items);
      }
    } catch (error) {
      console.error('Error loading gallery items:', error);
      Alert.alert('Error', 'Failed to load gallery items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save gallery item
  const saveGalleryItem = async (uri: string, caption: string, type: 'image' | 'voice_caption' = 'image') => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const newItem: GalleryItem = {
        id: Date.now().toString(),
        uri,
        caption,
        createdAt: Date.now(),
        userId: user.id,
        type,
      };

      const updatedItems = [...galleryItems, newItem];
      await AsyncStorage.setItem('galleryItems', JSON.stringify(updatedItems));
      setGalleryItems(updatedItems);
    } catch (error) {
      console.error('Error saving gallery item:', error);
      Alert.alert('Error', 'Failed to save gallery item');
    }
  };

  // Save voice caption as card
  const saveVoiceCaption = async (caption: string) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const newItem: GalleryItem = {
        id: Date.now().toString(),
        uri: '', // No image URI for voice captions
        caption,
        createdAt: Date.now(),
        userId: user.id,
        type: 'voice_caption',
      };

      const updatedItems = [...galleryItems, newItem];
      await AsyncStorage.setItem('galleryItems', JSON.stringify(updatedItems));
      setGalleryItems(updatedItems);
      setCurrentCaption(''); // Clear the current caption
    } catch (error) {
      console.error('Error saving voice caption:', error);
      Alert.alert('Error', 'Failed to save voice caption');
    }
  };

  // Delete gallery item
  const deleteGalleryItem = async (itemId: string) => {
    try {
      const updatedItems = galleryItems.filter(item => item.id !== itemId);
      await AsyncStorage.setItem('galleryItems', JSON.stringify(updatedItems));
      setGalleryItems(updatedItems);
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      Alert.alert('Error', 'Failed to delete gallery item');
    }
  };

  // Confirm delete
  const confirmDelete = (item: GalleryItem) => {
    const isVoiceCaption = item.type === 'voice_caption';
    Alert.alert(
      isVoiceCaption ? 'Delete Voice Note' : 'Delete Image',
      `Are you sure you want to delete this ${isVoiceCaption ? 'voice note' : 'image'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGalleryItem(item.id) }
      ]
    );
  };

  // Request permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const status = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const cameraGranted = status[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        const audioGranted = status[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        
        setPermissionStatus(cameraGranted && audioGranted);
        return audioGranted; // For voice recording, we only need audio permission
      } catch (error) {
        console.error('Error requesting permissions:', error);
        return false;
      }
    }

    return true;
  };

  // Request audio permission specifically for voice recording
  const requestAudioPermission = async () => {
    if (Platform.OS === 'web') {
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record voice notes.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Error requesting audio permission:', error);
        return false;
      }
    }

    return true;
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission required', 'Please grant all permissions to continue');
        return;
      }

      // Check if image picker is available
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        selectionLimit: 1,
        allowsMultipleSelection: false,
      });

      // If editing failed or was cancelled, try without editing
      if (result.canceled) {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
          selectionLimit: 1,
          allowsMultipleSelection: false,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        await saveGalleryItem(selectedAsset.uri, 'New Image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission required', 'Please grant all permissions to continue');
        return;
      }

      // Check camera permissions
      const cameraPermissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        cameraType: ImagePicker.CameraType.back,
      });

      // If editing failed or was cancelled, try without editing
      if (result.canceled) {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
          cameraType: ImagePicker.CameraType.back,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        await saveGalleryItem(selectedAsset.uri, 'New Photo');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Share item
  const shareItem = async (item: GalleryItem) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available on this device');
        return;
      }

      await Sharing.shareAsync(item.uri);
    } catch (error) {
      console.error('Error sharing item:', error);
      Alert.alert('Error', 'Failed to share item');
    }
  };

  // Voice recording handlers
  const onSpeechStart = (e: any) => {
    console.log('onSpeechStart:', e);
    setCurrentCaption('');
  };

  const onSpeechEnd = (e: any) => {
    console.log('onSpeechEnd:', e);
    setIsRecording(false);
  };

  const onSpeechResults = (e: any) => {
    console.log('onSpeechResults:', e);
    if (e.value && e.value.length > 0) {
      setCurrentCaption(e.value[0]);
    }
  };

  // Toggle voice recording
  const toggleRecording = async () => {
    // For now, always use manual input to avoid the Voice library issues
    if (Platform.OS !== 'web' && (!voiceAvailable || !Voice)) {
      Alert.prompt(
        'Add Voice Note',
        'Type your note:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Save', 
            onPress: (text?: string) => {
              if (text && text.trim()) {
                setCurrentCaption(text.trim());
              }
            }
          }
        ],
        'plain-text'
      );
      return;
    }

    if (Platform.OS === 'web') {
      // Web Speech API implementation
      try {
        if (isRecording) {
          // Stop recording (web handles this automatically)
          setIsRecording(false);
          return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          Alert.alert('Voice input', 'Voice dictation is not supported on this browser.');
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsRecording(true);
          setCurrentCaption('');
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setCurrentCaption(transcript);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          Alert.alert('Voice Error', 'Failed to recognize speech. Please try again.');
        };

        recognition.start();
      } catch (error) {
        console.error('Error with web speech recognition:', error);
        Alert.alert('Voice Error', 'Voice recognition failed. Please try again.');
      }
      return;
    }

    // Native implementation
    try {
      // Check if Voice is available using our safer check
      if (!voiceAvailable || !Voice) {
        // Fallback to manual text input
        Alert.alert(
          'Voice Not Available',
          'Voice recording is not available on this device. Would you like to type your note instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Type Note', 
              onPress: () => {
                Alert.prompt(
                  'Add Voice Note',
                  'Type your note:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Save', 
                      onPress: (text?: string) => {
                        if (text && text.trim()) {
                          setCurrentCaption(text.trim());
                        }
                      }
                    }
                  ],
                  'plain-text'
                );
              }
            }
          ]
        );
        return;
      }

      // Double check that required methods exist
      if (!Voice.start || !Voice.stop) {
        Alert.alert('Voice Error', 'Voice recording methods are not available.');
        return;
      }

      if (isRecording) {
        try {
          if (Voice.stop) {
            await Voice.stop();
          }
          setIsRecording(false);
        } catch (stopError) {
          console.error('Error stopping voice:', stopError);
          setIsRecording(false);
        }
      } else {
        // Check audio permission first
        const hasAudioPermission = await requestAudioPermission();
        if (!hasAudioPermission) {
          Alert.alert('Permission Required', 'Please grant microphone permission to use voice recording.');
          return;
        }
        
        // Check if voice is available (Android specific)
        if (Voice.isAvailable) {
          try {
            const available = await Voice.isAvailable();
            if (!available) {
              Alert.alert('Voice Error', 'Voice recognition is not available on this device.');
              return;
            }
          } catch (availabilityError) {
            console.log('Could not check voice availability:', availabilityError);
            // Continue anyway, let the start method handle it
          }
        }

        // Start voice recognition
        if (Voice.start) {
          await Voice.start('en-US');
          setIsRecording(true);
        }
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      setIsRecording(false);
      
      // More specific error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('permission')) {
        Alert.alert('Permission Error', 'Microphone permission is required for voice recording.');
      } else if (errorMessage.includes('not available')) {
        Alert.alert('Voice Error', 'Voice recognition is not available on this device.');
      } else {
        Alert.alert('Voice Error', 'Voice recording failed. Please try again.');
      }
    }
  };

  // Set up voice recognition
  useEffect(() => {
    if (Platform.OS !== 'web' && voiceAvailable && Voice) {
      const setupVoice = async () => {
        try {
          console.log('Setting up voice recognition...');

          // Clean up any existing listeners first
          try {
            if (Voice.removeAllListeners && typeof Voice.removeAllListeners === 'function') {
              Voice.removeAllListeners();
            }
            if (Voice.destroy && typeof Voice.destroy === 'function') {
              await Voice.destroy();
            }
          } catch (destroyError) {
            // Ignore destroy errors on first setup
            console.log('Voice destroy error (expected on first run):', destroyError);
          }
          
          // Set up new listeners only if Voice methods exist
          try {
            if (Voice.onSpeechStart !== undefined) {
              Voice.onSpeechStart = onSpeechStart;
            }
            if (Voice.onSpeechEnd !== undefined) {
              Voice.onSpeechEnd = onSpeechEnd;
            }
            if (Voice.onSpeechResults !== undefined) {
              Voice.onSpeechResults = onSpeechResults;
            }
            if (Voice.onSpeechError !== undefined) {
              Voice.onSpeechError = (error: any) => {
                console.error('Speech error:', error);
                setIsRecording(false);
                
                // Don't show alert for every error, some are expected
                if (error?.error?.message && !error.error.message.includes('No speech input')) {
                  Alert.alert('Voice Error', 'Voice recognition failed. Please try again.');
                }
              };
            }
          } catch (listenerError) {
            console.error('Error setting up voice listeners:', listenerError);
          }
          
          // Android-specific: Check if speech recognition is available
          if (Platform.OS === 'android' && Voice.isAvailable && typeof Voice.isAvailable === 'function') {
            try {
              const available = await Voice.isAvailable();
              console.log('Voice recognition available:', available);
            } catch (availabilityError) {
              console.log('Could not check voice availability:', availabilityError);
            }
          }
        } catch (error) {
          console.error('Error setting up voice:', error);
        }
      };

      setupVoice();

      return () => {
        const cleanup = async () => {
          try {
            if (voiceAvailable && Voice) {
              if (isRecording && Voice.stop && typeof Voice.stop === 'function') {
                await Voice.stop();
              }
              if (Voice.destroy && typeof Voice.destroy === 'function') {
                await Voice.destroy();
              }
              if (Voice.removeAllListeners && typeof Voice.removeAllListeners === 'function') {
                Voice.removeAllListeners();
              }
            }
          } catch (error) {
            console.error('Error cleaning up voice:', error);
          }
        };
        cleanup();
      };
    } else {
      console.log('Voice setup skipped - not available or web platform');
    }
  }, []);

  // Load gallery items on mount
  useEffect(() => {
    loadGalleryItems();
  }, [loadGalleryItems]);

  // Render gallery item
  const renderItem = ({ item }: { item: GalleryItem }) => {
    if (item.type === 'voice_caption') {
      // Render voice caption card
      return (
        <View style={styles.voiceCaptionCard}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => confirmDelete(item)}
          >
            <Ionicons name="trash" size={16} color="white" />
          </TouchableOpacity>
          <View style={styles.voiceCaptionHeader}>
            <Ionicons name="mic" size={24} color="#007AFF" />
            <Text style={styles.voiceCaptionTitle}>Voice Note</Text>
          </View>
          <Text style={styles.voiceCaptionText}>{item.caption}</Text>
          <Text style={styles.voiceCaptionDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      );
    }

    // Render image card
    return (
      <View style={styles.galleryItem}>
        <Image source={{ uri: item.uri }} style={styles.galleryImage} />
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => confirmDelete(item)}
        >
          <Ionicons name="trash" size={16} color="white" />
        </TouchableOpacity>
        <View style={styles.itemFooter}>
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption || 'No caption'}
          </Text>
          <TouchableOpacity 
            style={[styles.button, styles.shareButton]} 
            onPress={() => shareItem(item)}
          >
            <Ionicons name="share-social" size={20} color="white" />
            <Text style={styles.buttonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Render empty state
  if (galleryItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images" size={64} color="#CCCCCC" />
        <Text style={styles.emptyText}>No images yet</Text>
        <Text style={styles.emptySubtext}>Add some photos to get started</Text>
        <View style={styles.emptyButtonsContainer}>
          <TouchableOpacity style={[styles.button, styles.emptyButton]} onPress={pickImage}>
            <Ionicons name="image" size={20} color="white" />
            <Text style={styles.buttonText}>Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.emptyButton]} onPress={takePhoto}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main render
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <SafeAreaView style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Gallery</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={pickImage}>
              <Ionicons name="image" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={galleryItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.galleryList}
      />

      {/* Add image FAB */}
      <TouchableOpacity
        style={styles.addFab}
        onPress={() => {
          Alert.alert(
            'Add Image',
            'Choose an option',
            [
              { text: 'Camera', onPress: takePhoto },
              { text: 'Library', onPress: pickImage },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Voice recording FAB */}
      <TouchableOpacity 
        style={[styles.voiceFab, isRecording && styles.voiceFabRecording]}
        onPress={toggleRecording}
        onLongPress={() => {
          // Manual text input as fallback
          Alert.prompt(
            'Add Voice Note',
            'Type your note:',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Save', 
                onPress: (text?: string) => {
                  if (text && text.trim()) {
                    setCurrentCaption(text.trim());
                  }
                }
              }
            ],
            'plain-text'
          );
        }}
      >
        <Ionicons 
          name={
            Platform.OS === 'web' 
              ? (isRecording ? 'mic-off' : 'mic')
              : (voiceAvailable && Voice) 
                ? (isRecording ? 'mic-off' : 'mic')
                : 'create-outline'
          }
          size={24} 
          color="white" 
        />
      </TouchableOpacity>

      {/* Caption input */}
      {currentCaption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>{currentCaption}</Text>
          <View style={styles.captionActions}>
            <TouchableOpacity 
              style={styles.editCaptionButton}
              onPress={() => {
                Alert.prompt(
                  'Edit Caption',
                  'Edit your voice note:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Save', 
                      onPress: (text?: string) => {
                        if (text && text.trim()) {
                          setCurrentCaption(text.trim());
                        }
                      }
                    }
                  ],
                  'plain-text',
                  currentCaption
                );
              }}
            >
              <Ionicons name="pencil" size={16} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveCaptionButton}
              onPress={() => saveVoiceCaption(currentCaption)}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.saveCaptionText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
    padding: 8,
  },
  galleryList: {
    padding: 8,
  },
  galleryItem: {
    flex: 1,
    margin: 4,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  galleryImage: {
    width: '100%',
    aspectRatio: 1,
  },
  itemFooter: {
    padding: 12,
  },
  caption: {
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  shareButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  addFab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  voiceFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  voiceFabRecording: {
    backgroundColor: '#FF3B30',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 12,
  },
  captionText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  emptyButtonsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  voiceCaptionCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  voiceCaptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceCaptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  voiceCaptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  voiceCaptionDate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  saveCaptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  saveCaptionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  captionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  editCaptionButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginRight: 8,
  },
});

export default GalleryScreen;
