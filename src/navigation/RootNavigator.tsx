import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../store/useAppStore';
import { initNotifications, syncEventReminders } from '../services/notifications';
import { autoSync } from '../services/sync';
import { colors } from '../theme/theme';
import { t } from '../i18n/pl';
import OnboardingScreen from '../screens/OnboardingScreen';
import TodayScreen from '../screens/TodayScreen';
import KnowledgeScreen from '../screens/KnowledgeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import JournalScreen from '../screens/JournalScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AssistantScreen from '../screens/AssistantScreen';
import VideoLibraryScreen from '../screens/VideoLibraryScreen';
import CommunityScreen from '../screens/CommunityScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, primary: colors.primary, text: colors.text, border: colors.border },
};

const icon = (emoji: string, label: string) => () => (
  <Text accessibilityLabel={label} style={{ fontSize: 22 }}>{emoji}</Text>
);

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textMuted }}>
      <Tab.Screen name="Today" component={TodayScreen} options={{ title: t.tabs.today, tabBarIcon: icon('🏠', t.tabs.today) }} />
      <Tab.Screen name="Knowledge" component={KnowledgeScreen} options={{ title: t.tabs.knowledge, tabBarIcon: icon('📖', t.tabs.knowledge) }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: t.tabs.calendar, tabBarIcon: icon('📅', t.tabs.calendar) }} />
      <Tab.Screen name="Journal" component={JournalScreen} options={{ title: t.tabs.journal, tabBarIcon: icon('📊', t.tabs.journal) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t.tabs.profile, tabBarIcon: icon('👤', t.tabs.profile) }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const onboarded = useAppStore(s => s.onboarded);
  const events = useAppStore(s => s.events);

  // Synchronizacja przypomnień push (dzień wcześniej, 9:00) przy zmianach kalendarza
  React.useEffect(() => {
    if (!onboarded) return;
    initNotifications();
    syncEventReminders(events);
  }, [onboarded, JSON.stringify(events.map(e => e.id + e.date))]);

  // Tryb pary: auto-sync przy starcie aplikacji i po sparowaniu
  const coupleId = useAppStore(s => s.coupleId);
  React.useEffect(() => {
    if (onboarded && coupleId) autoSync().catch(() => {});
  }, [onboarded, coupleId]);

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator>
        {onboarded ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Assistant" component={AssistantScreen}
              options={{ title: '💬 Asystent rodzica', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text }} />
            <Stack.Screen name="VideoLibrary" component={VideoLibraryScreen}
              options={{ title: '🎬 Biblioteka wideo', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text }} />
            <Stack.Screen name="Community" component={CommunityScreen}
              options={{ title: '👥 Społeczność', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text }} />
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
