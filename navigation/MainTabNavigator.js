import React from 'react';
import { Platform } from 'react-native';
import {
  createStackNavigator,
  createBottomTabNavigator,
} from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import Transcription from '../screens/Transcription';
import Recorder from '../screens/Recorder';

const HomeStack = createStackNavigator({
  Home: HomeScreen,
  Transcription: Transcription,
  Recorder: Recorder,
});

HomeStack.navigationOptions = {
  tabBarLabel: 'Home',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={
        Platform.OS === 'ios'
          ? `ios-information-circle${focused ? '' : '-outline'}`
          : 'md-information-circle'
      }
    />
  ),
};

const RecorderStack = createStackNavigator({
  Recorder: Recorder,
});

RecorderStack.navigationOptions = {
  tabBarLabel: 'Recorder',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-link' : 'md-link'}
    />
  ),
};

export default createBottomTabNavigator({
  HomeStack,
  RecorderStack,
  // TranscriptionStack,
});
