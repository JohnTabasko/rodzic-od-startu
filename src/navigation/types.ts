import type { CompositeNavigationProp, NavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Assistant: undefined;
  VideoLibrary: undefined;
  Community: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  Knowledge: undefined;
  Calendar: undefined;
  Journal: undefined;
  Profile: undefined;
};

export type AppNavigationProp = CompositeNavigationProp<
  NavigationProp<MainTabParamList>,
  NavigationProp<RootStackParamList>
>;
