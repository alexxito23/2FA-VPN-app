import React from 'react';
import {
  DarkTheme,
  NavigationContainer,
  ThemeProvider,
} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from './app/screens/HomeScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import ProfileScreen from './app/screens/ProfileScreen';
import './global.css';
import {Platform} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <ThemeProvider value={DarkTheme}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#0fab94',
            tabBarStyle: {
              backgroundColor: '#292734',
              position: Platform.OS === 'ios' ? 'absolute' : 'relative',
              borderTopWidth: 0,
              elevation: 5,
              shadowOpacity: 0.1,
            },
          }}>
          <Tab.Screen
            name="Inicio"
            component={HomeScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Icon size={24} name="house-signal" color={color} />
              ),
              tabBarLabelStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Tab.Screen
            name="Conexión"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Icon size={24} name="wifi" color={color} />
              ),
              tabBarLabelStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Tab.Screen
            name="Perfiles"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({color}) => (
                <Icon size={24} name="building-user" color={color} />
              ),
              tabBarLabelStyle: {
                fontWeight: 'bold',
              },
            }}
          />
        </Tab.Navigator>
      </ThemeProvider>
    </NavigationContainer>
  );
}
