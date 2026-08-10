import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from './types';
import { useAppStore } from '../store/useAppStore';
import { autoSync } from '../services/sync';
import { initNotifications, syncEventReminders } from '../services/notifications';
import { colors, radius, shadows } from '../theme/theme';
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

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

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
    border: colors.line,
  },
};

const tabIcon =
  (name: IconName, label: string) =>
  ({ color, focused }: { color: string; focused: boolean }) => (
    <MaterialCommunityIcons
      name={name}
      size={focused ? 25 : 23}
      color={color}
      accessibilityLabel={label}
    />
  );

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
        tabBarItemStyle: { paddingTop: 4 },
        tabBarStyle: {
          height: 72,
          marginHorizontal: 12,
          marginBottom: 12,
          borderRadius: radius.card,
          borderWidth: 1,
          borderTopWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface,
          ...shadows.card,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ title: t.tabs.today, tabBarIcon: tabIcon('home-variant-outline', t.tabs.today) }}
      />
      <Tab.Screen
        name="Knowledge"
        component={KnowledgeScreen}
        options={{
          title: t.tabs.knowledge,
          tabBarIcon: tabIcon('book-open-page-variant-outline', t.tabs.knowledge),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: t.tabs.calendar,
          tabBarIcon: tabIcon('calendar-month-outline', t.tabs.calendar),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{ title: t.tabs.journal, tabBarIcon: tabIcon('notebook-outline', t.tabs.journal) }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t.tabs.profile,
          tabBarIcon: tabIcon('account-circle-outline', t.tabs.profile),
        }}
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
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
        }}
      >
        {onboarded ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Assistant"
              component={AssistantScreen}
              options={{ title: 'Asystentka rodzica' }}
            />
            <Stack.Screen
              name="VideoLibrary"
              component={VideoLibraryScreen}
              options={{ title: 'Biblioteka wideo' }}
            />
            <Stack.Screen
              name="Community"
              component={CommunityScreen}
              options={{ title: 'Społeczność' }}
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
