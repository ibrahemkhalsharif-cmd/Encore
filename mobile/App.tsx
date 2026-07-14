import {
  Fraunces_600SemiBold,
  Fraunces_700Bold_Italic,
  useFonts,
} from '@expo-google-fonts/fraunces';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/auth';
import { LoginScreen } from './src/screens/LoginScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { TicketScreen } from './src/screens/TicketScreen';
import { TicketsScreen } from './src/screens/TicketsScreen';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.ink,
    primary: colors.accent,
    border: colors.line,
  },
};

function Root() {
  const { user, ready, signOut } = useAuth();

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (!user) return <LoginScreen />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontFamily: 'Fraunces_600SemiBold' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Tickets"
        component={TicketsScreen}
        options={({ navigation }) => ({
          title: 'My tickets',
          headerLeft: () => (
            <Pressable onPress={signOut}>
              <Text style={{ color: colors.muted }}>Sign out</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate('Scan')}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>
                Scan
              </Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="Ticket"
        component={TicketScreen}
        options={{ title: 'Ticket' }}
      />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{ title: 'Door check-in' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold_Italic,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <AuthProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="dark" />
        <Root />
      </NavigationContainer>
    </AuthProvider>
  );
}
