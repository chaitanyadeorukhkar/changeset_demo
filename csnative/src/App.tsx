import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppNavigationProp } from './Navigation/types';

interface Props {
  navigation: AppNavigationProp;
}

const App: React.FC<Props> = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Your app root</Text>
    <TouchableOpacity
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginTop: 8,
        backgroundColor: 'rgb(11, 112, 231)',
        borderRadius: 4,
      }}
      onPress={() => navigation.navigate('Details')}
    >
      <Text style={{ color: 'white' }}>See More Details</Text>
    </TouchableOpacity>
  </View>
);

export default App;
