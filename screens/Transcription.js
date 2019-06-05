import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Button,
} from 'react-native';
import { Font } from 'expo';

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get('window');
const BACKGROUND_COLOR = '#FFF8ED';

export default class SettingsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      transcription: '',
      fontLoaded: false,
    };
  }
  static navigationOptions = {
    title: 'Transcription',
  };

  componentDidMount() {
    (async () => {
      await Font.loadAsync({
        'cutive-mono-regular': require('../assets/fonts/CutiveMono-Regular.ttf'),
      });
      this.setState({ fontLoaded: true });
    })();
    let transcription = this.props.navigation.getParam('transcription', 'N/A');
    this.setState({
      transcription,
    });
  }

  render() {
    const { navigation } = this.props;
    let transcription = navigation.getParam('transcription', 'N/A');

    return !this.state.fontLoaded ? (
      <View style={styles.container} />
    ) : (
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.emptyContainer} />
          <Text
            style={[
              styles.noPermissionsText,
              { fontFamily: 'cutive-mono-regular' },
            ]}
          >
            Here's your transcription!
          </Text>
          <Text
            style={[
              styles.noPermissionsText,
              { fontFamily: 'cutive-mono-regular' },
            ]}
          >
            {transcription}
          </Text>
          <Button
            title="Go back"
            onPress={() => this.props.navigation.navigate('Recorder')}
          />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignSelf: 'stretch',
    backgroundColor: BACKGROUND_COLOR,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: BACKGROUND_COLOR,
    minHeight: DEVICE_HEIGHT,
    maxHeight: DEVICE_HEIGHT,
  },
});
