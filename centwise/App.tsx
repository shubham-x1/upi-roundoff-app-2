import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import GoalsScreen from './screens/goalspage';
import AnalyticsScreen from './screens/analyticspage';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Analytics" 
          component={AnalyticsScreen}
        />
        <Stack.Screen 
          name="Goals" 
          component={GoalsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
