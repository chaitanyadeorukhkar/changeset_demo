import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  App: undefined;
  Details: undefined;
};

export type AppNavigationProp = StackNavigationProp<RootStackParamList, 'App'>;
export type DetailsNavigationProp = StackNavigationProp<RootStackParamList, 'Details'>;
