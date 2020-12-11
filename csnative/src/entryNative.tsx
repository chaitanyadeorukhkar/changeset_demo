import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import packageJson from '../package.json';
import Navigation from './Navigation/Navigation';

AppRegistry.registerComponent(packageJson.name, () => Navigation);
