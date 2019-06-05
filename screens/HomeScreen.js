import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  Dimensions,
  View,
} from 'react-native';
import { WebBrowser, Asset, Font } from 'expo';

class Icon {
  constructor(module, width, height) {
    this.module = module;
    this.width = width;
    this.height = height;
    Asset.fromModule(this.module).downloadAsync();
  }
}

const ICON_RECORD_BUTTON = new Icon(
  require('../assets/images/record_button.png'),
  70,
  119
);

const ICON_PLAY_BUTTON = new Icon(
  require('../assets/images/play_button.png'),
  34,
  51
);

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get('window');
const BACKGROUND_COLOR = '#FFF8ED';

export default class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fontLoaded: false,
    };
  }

  static navigationOptions = {
    header: null,
  };
  componentDidMount() {
    (async () => {
      await Font.loadAsync({
        'cutive-mono-regular': require('../assets/fonts/CutiveMono-Regular.ttf'),
      });
      this.setState({ fontLoaded: true });
    })();
  }
  render() {
    return !this.state.fontLoaded ? (
      <View style={styles.container} />
    ) : (
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.welcomeContainer}>
            <Image
              source={
                __DEV__
                  ? ICON_RECORD_BUTTON.module
                  : require('../assets/images/robot-prod.png')
              }
            />
          </View>
          <View style={styles.getStartedContainer}>

            <Text
              style={[
                styles.noPermissionsText,
                { fontFamily: 'cutive-mono-regular' },
              ]}
            >
              Welcome to AudioScribe!
            </Text>

            <View
              style={[styles.codeHighlightContainer, styles.homeScreenFilename]}
            />
            <View style={styles.helpContainer}>
              <Text
                style={[
                  styles.noPermissionsText,
                  { fontFamily: 'cutive-mono-regular' },
                ]}
              >
                At a conference and want to listen instead of taking notes?
              </Text>
            </View>
            <View style={styles.getStartedContainer} />
     
          </View>
          <View style={styles.helpContainer}>
            <Text
              style={[
                styles.noPermissionsText,
                { fontFamily: 'cutive-mono-regular' },
              ]}
            >
              AudioScribe, at your service!
            </Text>
          </View>
          <View style={styles.getStartedContainer} />
          <View style={styles.helpContainer}>
            <Text
              style={[
                styles.noPermissionsText,
                { fontFamily: 'cutive-mono-regular' },
              ]}
            >
              Once you record, scroll down and you'll see a transcribed version
              of your audio!
            </Text>
          </View>
          <View style={styles.helpContainer}>
            <Text
              style={[
                styles.noPermissionsText,
                { fontFamily: 'cutive-mono-regular' },
              ]}
            >
              No more cramped hands, ever, forever!
            </Text>
          </View>

          <View style={styles.helpContainer}>
            <Image
              source={ICON_PLAY_BUTTON.module}
              style={styles.welcomeImage}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  _maybeRenderDevelopmentModeWarning() {
    if (__DEV__) {
      const learnMoreButton = (
        <Text onPress={this._handleLearnMorePress} style={styles.helpLinkText}>
          Learn more
        </Text>
      );

      return (
        <Text style={styles.developmentModeText}>
          Development mode is enabled, your app will be slower but you can use
          useful development tools. {learnMoreButton}
        </Text>
      );
    } else {
      return (
        <Text style={styles.developmentModeText}>
          You are not in development mode, your app will run at full speed.
        </Text>
      );
    }
  }

  _handleLearnMorePress = () => {
    WebBrowser.openBrowserAsync(
      'https://docs.expo.io/versions/latest/guides/development-mode'
    );
  };

  _handleHelpPress = () => {
    WebBrowser.openBrowserAsync(
      'https://docs.expo.io/versions/latest/guides/up-and-running.html#can-t-see-your-changes'
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  developmentModeText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  contentContainer: {
    paddingTop: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightText: {
    color: 'rgba(96,100,109, 0.8)',
  },
  codeHighlightContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 24,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  tabBarInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 20,
      },
    }),
    alignItems: 'center',
    backgroundColor: '#fbfbfb',
    paddingVertical: 20,
  },
  tabBarInfoText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center',
  },
  navigationFilename: {
    marginTop: 5,
  },
  helpContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
