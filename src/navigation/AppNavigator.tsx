import { useAuth } from '../auth/useAuth';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import HomeScreen from '../screens/HomeScreen';
import AuthScreen from '../auth/AuthScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HouseholdBadge from '../components/HouseholdBadge';
import { useHousehold } from '../context/HouseholdContext';
import { Text, TouchableOpacity, useColorScheme } from 'react-native';
import { useEffect, useRef } from 'react';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading: authLoading, session } = useAuth();
  const { household, members, loadHousehold } = useHousehold();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const loadedForSession = useRef<string | null>(null);

  useEffect(() => {
    if (user && session?.access_token && loadedForSession.current !== session.access_token) {
      loadedForSession.current = session.access_token;
      loadHousehold(user.id);
    }
    if (!user) {
      loadedForSession.current = null;
    }
  }, [user, session]);

  if (authLoading) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? '#1c1c1e' : '#366092' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: isDark ? '#000' : '#f2f2f7' },
      }}
    >
      {!user ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={({ navigation }) => ({
              title: 'Tag',
              headerTitle: () =>
                household ? (
                  <HouseholdBadge household={household} memberCount={members.length} />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Tag</Text>
                ),
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Settings')}
                  style={{ paddingHorizontal: 12 }}
                >
                  <Text style={{ color: '#fff', fontSize: 15 }}>Settings</Text>
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}