import GalleryScreen from '@/screens/GalleryScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform, View } from 'react-native';

export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function EmptyScreen() {
  return null;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'image';

          if (route.name === 'Gallery') {
            iconName = focused ? 'images' : 'images-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name='Gallery' component={GalleryScreen} />
      <Tab.Screen
        name='Add'
        component={EmptyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View
              style={{
                backgroundColor: '#007AFF',
                width: 56,
                height: 56,
                borderRadius: 28,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: Platform.OS === 'ios' ? 0 : 20,
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
              }}
            >
              <Ionicons name='add' size={32} color='white' />
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // This will be handled by the FAB in GalleryScreen
          },
        })}
      />
      <Tab.Screen name='Settings' component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  console.log(isSignedIn)

  if (!isLoaded) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isSignedIn ? (
        <Stack.Screen name='Login' component={LoginScreen} />
      ) : (
        <Stack.Screen name='MainTabs' component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}
