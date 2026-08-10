import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from './types';
import { useAppStore } from '../store/useAppStore';
import { autoSync } from '../services/sync';
import { initNotifications, syncEventReminders } from '../services/notifications';
import { colors } from '../theme/theme';
import { t } from '../i18n/pl';
import AssistantScreen from '../screens/AssistantScreen';
import CalendarScreen from '../screens/CalendarScreen';
import CommunityScreen from '../screens/CommunityScreen';
import JournalScreen from '../screens/JournalScreen';
import KnowledgeScreen from '../screens/KnowledgeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TodayScreen from '../screens/TodayScreen';
import VideoLibraryScreen from '../screens/VideoLibraryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

const icon = (emoji: string, label: string) => () => (
  <Text accessibilityLabel={label} style={{ fontSize: 22 }}>
    {emoji}
  </Text>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ title: t.tabs.today, tabBarIcon: icon('🏠', t.tabs.today) }}
      />
      <Tab.Screen
        name="Knowledge"
        component={KnowledgeScreen}
        options={{ title: t.tabs.knowledge, tabBarIcon: icon('📖', t.tabs.knowledge) }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: t.tabs.calendar, tabBarIcon: icon('📅', t.tabs.calendar) }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{ title: t.tabs.journal, tabBarIcon: icon('📊', t.tabs.journal) }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t.tabs.profile, tabBarIcon: icon('👤', t.tabs.profile) }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const onboarded = useAppStore((state) => state.onboarded);
  const events = useAppStore((state) => state.events);
  const coupleId = useAppStore((state) => state.coupleId);
  const pairMemberCount = useAppStore((state) => state.pairMemberCount);

  React.useEffect(() => {
    if (onboarded) initNotifications();
  }, [onboarded]);

  React.useEffect(() => {
    if (!onboarded) return;
    void syncEventReminders(events);
  }, [onboarded, events]);

  React.useEffect(() => {
    if (onboarded && coupleId && pairMemberCount === 2) {
      void autoSync().catch(() => undefined);
    }
  }, [onboarded, coupleId, pairMemberCount]);

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator>
        {onboarded ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Assistant"
              component={AssistantScreen}
              options={{
                title: '💬 Asystent rodzica',
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
              }}
            />
            <Stack.Screen
              name="VideoLibrary"
              component={VideoLibraryScreen}
              options={{
                title: '🎬 Biblioteka wideo',
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
              }}
            />
            <Stack.Screen
              name="Community"
              component={CommunityScreen}
              options={{
                title: '👥 Społeczność',
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
