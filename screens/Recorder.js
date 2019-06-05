import React from 'react';
import {
  Dimensions,
  Image,
  Slider,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  ScrollView,
  Button,
} from 'react-native';
import { Asset, Audio, FileSystem, Font, Permissions } from 'expo';
import Transcription from './Transcription';
const config = require('../config');

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
const ICON_RECORDING = new Icon(
  require('../assets/images/record_icon.png'),
  20,
  14
);

const ICON_PLAY_BUTTON = new Icon(
  require('../assets/images/play_button.png'),
  34,
  51
);
const ICON_PAUSE_BUTTON = new Icon(
  require('../assets/images/pause_button.png'),
  34,
  51
);
const ICON_STOP_BUTTON = new Icon(
  require('../assets/images/stop_button.png'),
  22,
  22
);

const ICON_MUTED_BUTTON = new Icon(
  require('../assets/images/muted_button.png'),
  67,
  58
);
const ICON_UNMUTED_BUTTON = new Icon(
  require('../assets/images/unmuted_button.png'),
  67,
  58
);

const ICON_TRACK_1 = new Icon(require('../assets/images/track_1.png'), 166, 5);
const ICON_THUMB_1 = new Icon(require('../assets/images/thumb_1.png'), 18, 19);
const ICON_THUMB_2 = new Icon(require('../assets/images/thumb_2.png'), 15, 19);

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get('window');
const BACKGROUND_COLOR = '#FFF8ED';
const LIVE_COLOR = '#FF0000';
const DISABLED_OPACITY = 0.5;
const RATE_SCALE = 3.0;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.recording = null;
    this.sound = null;
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.state = {
      haveRecordingPermissions: false,
      isLoading: false,
      isPlaybackAllowed: false,
      muted: false,
      soundPosition: null,
      soundDuration: null,
      recordingDuration: null,
      shouldPlay: false,
      isPlaying: false,
      isRecording: false,
      fontLoaded: false,
      shouldCorrectPitch: true,
      volume: 1.0,
      rate: 1.0,
      query: '',
      isFetching: false,
    };

    const RECORDING_OPTIONS_PRESET_LOW_QUALITY = {
      android: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.wav',
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    };

    this.recordingSettings = JSON.parse(
      JSON.stringify(RECORDING_OPTIONS_PRESET_LOW_QUALITY)
    );
  }

  componentDidMount() {
    (async () => {
      await Font.loadAsync({
        'cutive-mono-regular': require('../assets/fonts/CutiveMono-Regular.ttf'),
      });
      this.setState({ fontLoaded: true });
    })();
    this._askForPermissions();
  }

  _askForPermissions = async () => {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({
      haveRecordingPermissions: response.status === 'granted',
    });
  };

  _updateScreenForSoundStatus = status => {
    if (status.isLoaded) {
      this.setState({
        soundDuration: status.durationMillis,
        soundPosition: status.positionMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        rate: status.rate,
        muted: status.isMuted,
        volume: status.volume,
        shouldCorrectPitch: status.shouldCorrectPitch,
        isPlaybackAllowed: true,
      });
    } else {
      this.setState({
        soundDuration: null,
        soundPosition: null,
        isPlaybackAllowed: false,
      });
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  _updateScreenForRecordingStatus = status => {
    if (status.canRecord) {
      this.setState({
        isRecording: status.isRecording,
        recordingDuration: status.durationMillis,
      });
    } else if (status.isDoneRecording) {
      this.setState({
        isRecording: false,
        recordingDuration: status.durationMillis,
      });
      if (!this.state.isLoading) {
        this._stopRecordingAndEnablePlayback();
      }
    }
  };

  _deleteRecordingFile = async () => {
    console.log('Deleting file');
    try {
      const info = await FileSystem.getInfoAsync(this.recording.getURI());
      await FileSystem.deleteAsync(info.uri);
    } catch (error) {
      console.log('There was an error deleting recording file', error);
    }
  };

  async _stopPlaybackAndBeginRecording() {
    this.setState({
      isLoading: true,
    });
    if (this.sound !== null) {
      await this.sound.unloadAsync();
      this.sound.setOnPlaybackStatusUpdate(null);
      this.sound = null;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
    });
    if (this.recording !== null) {
      this.recording.setOnRecordingStatusUpdate(null);
      this.recording = null;
    }

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(this.recordingSettings);
    recording.setOnRecordingStatusUpdate(this._updateScreenForRecordingStatus);

    this.recording = recording;
    await this.recording.startAsync();
    this.setState({
      isLoading: false,
    });
  }

  _getTranscription = async () => {
    this.setState({ isFetching: true });
    try {
      const info = await FileSystem.getInfoAsync(this.recording.getURI());
      console.log(`FILE INFO: ${JSON.stringify(info)}`);
      const uri = info.uri;
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/x-wav',
        name: 'speech2text',
      });
      const response = await fetch(config.CLOUD_FUNCTION_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log(data);
      this.setState({ query: data.transcript });
      console.log(this.state.query);
    } catch (error) {
      console.log('There was an error reading file', error);
    }
    this.setState({ isFetching: false });
  };

  async _stopRecordingAndEnablePlayback() {
    this.setState({
      isLoading: true,
    });
    try {
      await this.recording.stopAndUnloadAsync();
    } catch (error) {
      // Nothing -- already unloaded!
    }
    const info = await FileSystem.getInfoAsync(this.recording.getURI());
    console.log(`FILE INFO: ${JSON.stringify(info)}`);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
    });
    const { sound, status } = await this.recording.createNewLoadedSoundAsync(
      {
        isLooping: true,
        isMuted: this.state.muted,
        volume: this.state.volume,
        rate: this.state.rate,
        shouldCorrectPitch: this.state.shouldCorrectPitch,
      },
      this._updateScreenForSoundStatus
    );
    this.sound = sound;
    this.setState({
      isLoading: false,
    });
  }

  _onRecordPressed = () => {
    if (this.state.isRecording) {
      this._stopRecordingAndEnablePlayback();
      this._getTranscription();
    } else {
      this._stopPlaybackAndBeginRecording();
    }
  };

  _onPlayPausePressed = () => {
    if (this.sound != null) {
      if (this.state.isPlaying) {
        this.sound.pauseAsync();
      } else {
        this.sound.playAsync();
      }
    }
  };

  _onStopPressed = () => {
    if (this.sound != null) {
      this.sound.stopAsync();
    }
  };

  _onMutePressed = () => {
    if (this.sound != null) {
      this.sound.setIsMutedAsync(!this.state.muted);
    }
  };

  _onVolumeSliderValueChange = value => {
    if (this.sound != null) {
      this.sound.setVolumeAsync(value);
    }
  };

  _trySetRate = async (rate, shouldCorrectPitch) => {
    if (this.sound != null) {
      try {
        await this.sound.setRateAsync(rate, shouldCorrectPitch);
      } catch (error) {
        //NOTHING
      }
    }
  };

  _onRateSliderSlidingComplete = async value => {
    this._trySetRate(value * RATE_SCALE, this.state.shouldCorrectPitch);
  };

  _onPitchCorrectionPressed = async value => {
    this._trySetRate(this.state.rate, !this.state.shouldCorrectPitch);
  };

  _onSeekSliderValueChange = value => {
    if (this.sound != null && !this.isSeeking) {
      this.isSeeking = true;
      this.shouldPlayAtEndOfSeek = this.state.shouldPlay;
      this.sound.pauseAsync();
    }
  };

  _onSeekSliderSlidingComplete = async value => {
    if (this.sound != null) {
      this.isSeeking = false;
      const seekPosition = value * this.state.soundDuration;
      if (this.shouldPlayAtEndOfSeek) {
        this.sound.playFromPositionAsync(seekPosition);
      } else {
        this.sound.setPositionAsync(seekPosition);
      }
    }
  };

  _getSeekSliderPosition() {
    if (
      this.sound != null &&
      this.state.soundPosition != null &&
      this.state.soundDuration != null
    ) {
      return this.state.soundPosition / this.state.soundDuration;
    }
    return 0;
  }

  _getMMSSFromMillis(millis) {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);

    const padWithZero = number => {
      const string = number.toString();
      if (number < 10) {
        return '0' + string;
      }
      return string;
    };
    return padWithZero(minutes) + ':' + padWithZero(seconds);
  }

  _getPlaybackTimestamp() {
    if (
      this.sound != null &&
      this.state.soundPosition != null &&
      this.state.soundDuration != null
    ) {
      return `${this._getMMSSFromMillis(
        this.state.soundPosition
      )} / ${this._getMMSSFromMillis(this.state.soundDuration)}`;
    }
    return '';
  }

  _getRecordingTimestamp() {
    if (this.state.recordingDuration != null) {
      return `${this._getMMSSFromMillis(this.state.recordingDuration)}`;
    }
    return `${this._getMMSSFromMillis(0)}`;
  }
  // eslint-disable-next-line complexity
  render() {
    return !this.state.fontLoaded ? (
      <View style={styles.emptyContainer} />
    ) : !this.state.haveRecordingPermissions ? (
      <View style={styles.container}>
        <View />
        <Text
          style={[
            styles.noPermissionsText,
            { fontFamily: 'cutive-mono-regular' },
          ]}
        >
          You must enable audio recording permissions in order to use this app.
        </Text>
        <View />
      </View>
    ) : (
      <ScrollView>
        <View style={styles.container}>
          <View
            style={[
              styles.halfScreenContainer,
              {
                opacity: this.state.isLoading ? DISABLED_OPACITY : 1.0,
              },
            ]}
          >
            <View />
            <View style={styles.recordingContainer}>
              <View />
              <TouchableHighlight
                underlayColor={BACKGROUND_COLOR}
                style={styles.wrapper}
                onPress={this._onRecordPressed}
                disabled={this.state.isLoading}
              >
                <Image
                  style={styles.image}
                  source={ICON_RECORD_BUTTON.module}
                />
              </TouchableHighlight>
              <View style={styles.recordingDataContainer}>
                <View />
                <Text
                  style={[
                    styles.liveText,
                    { fontFamily: 'cutive-mono-regular' },
                  ]}
                >
                  {this.state.isRecording ? 'LIVE' : ''}
                </Text>
                <View style={styles.recordingDataRowContainer}>
                  <Image
                    style={[
                      styles.image,
                      { opacity: this.state.isRecording ? 1.0 : 0.0 },
                    ]}
                    source={ICON_RECORDING.module}
                  />
                  <Text
                    style={[
                      styles.recordingTimestamp,
                      { fontFamily: 'cutive-mono-regular' },
                    ]}
                  >
                    {this._getRecordingTimestamp()}
                  </Text>
                </View>
                <View />
              </View>
              <View />
            </View>
            <View />
          </View>
          <View
            style={[
              styles.halfScreenContainer,
              {
                opacity:
                  !this.state.isPlaybackAllowed || this.state.isLoading
                    ? DISABLED_OPACITY
                    : 1.0,
              },
            ]}
          >
            <View />
            <View style={styles.playbackContainer}>
              <Slider
                style={styles.playbackSlider}
                trackImage={ICON_TRACK_1.module}
                thumbImage={ICON_THUMB_1.module}
                value={this._getSeekSliderPosition()}
                onValueChange={this._onSeekSliderValueChange}
                onSlidingComplete={this._onSeekSliderSlidingComplete}
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
              />
              <Text
                style={[
                  styles.playbackTimestamp,
                  { fontFamily: 'cutive-mono-regular' },
                ]}
              >
                {this._getPlaybackTimestamp()}
              </Text>
            </View>
            <View
              style={[
                styles.buttonsContainerBase,
                styles.buttonsContainerTopRow,
              ]}
            >
              <View style={styles.volumeContainer}>
                <TouchableHighlight
                  underlayColor={BACKGROUND_COLOR}
                  style={styles.wrapper}
                  onPress={this._onMutePressed}
                  disabled={
                    !this.state.isPlaybackAllowed || this.state.isLoading
                  }
                >
                  <Image
                    style={styles.image}
                    source={
                      this.state.muted
                        ? ICON_MUTED_BUTTON.module
                        : ICON_UNMUTED_BUTTON.module
                    }
                  />
                </TouchableHighlight>
                <Slider
                  style={styles.volumeSlider}
                  trackImage={ICON_TRACK_1.module}
                  thumbImage={ICON_THUMB_2.module}
                  value={1}
                  onValueChange={this._onVolumeSliderValueChange}
                  disabled={
                    !this.state.isPlaybackAllowed || this.state.isLoading
                  }
                />
              </View>
              <View style={styles.playStopContainer}>
                <TouchableHighlight
                  underlayColor={BACKGROUND_COLOR}
                  style={styles.wrapper}
                  onPress={this._onPlayPausePressed}
                  disabled={
                    !this.state.isPlaybackAllowed || this.state.isLoading
                  }
                >
                  <Image
                    style={styles.image}
                    source={
                      this.state.isPlaying
                        ? ICON_PAUSE_BUTTON.module
                        : ICON_PLAY_BUTTON.module
                    }
                  />
                </TouchableHighlight>
                <TouchableHighlight
                  underlayColor={BACKGROUND_COLOR}
                  style={styles.wrapper}
                  onPress={this._onStopPressed}
                  disabled={
                    !this.state.isPlaybackAllowed || this.state.isLoading
                  }
                >
                  <Image
                    style={styles.image}
                    source={ICON_STOP_BUTTON.module}
                  />
                </TouchableHighlight>
              </View>
              <View />
            </View>
            <View
              style={[
                styles.buttonsContainerBase,
                styles.buttonsContainerBottomRow,
              ]}
            >
              <Text
                style={[
                  styles.timestamp,
                  { fontFamily: 'cutive-mono-regular' },
                ]}
              >
                Rate:
              </Text>
              <Slider
                style={styles.rateSlider}
                trackImage={ICON_TRACK_1.module}
                thumbImage={ICON_THUMB_1.module}
                value={this.state.rate / RATE_SCALE}
                onSlidingComplete={this._onRateSliderSlidingComplete}
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
              />
              <TouchableHighlight
                underlayColor={BACKGROUND_COLOR}
                style={styles.wrapper}
                onPress={this._onPitchCorrectionPressed}
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
              >
                <Text style={[{ fontFamily: 'cutive-mono-regular' }]}>
                  PC: {this.state.shouldCorrectPitch ? 'yes' : 'no'}
                </Text>
              </TouchableHighlight>
            </View>
            <View />
          </View>
        </View>
        <Button
          title="Transcription"
          style={styles.button}
          onPress={() =>
            this.props.navigation.push('Transcription', {
              transcription: this.state.query,
            })
          }
        />
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
  noPermissionsText: {
    textAlign: 'center',
  },
  wrapper: {},
  halfScreenContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: DEVICE_HEIGHT / 2.0,
    maxHeight: DEVICE_HEIGHT / 2.0,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: ICON_RECORD_BUTTON.height,
    maxHeight: ICON_RECORD_BUTTON.height,
  },
  recordingDataContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: ICON_RECORD_BUTTON.height,
    maxHeight: ICON_RECORD_BUTTON.height,
    minWidth: ICON_RECORD_BUTTON.width * 3.0,
    maxWidth: ICON_RECORD_BUTTON.width * 3.0,
  },
  recordingDataRowContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: ICON_RECORDING.height,
    maxHeight: ICON_RECORDING.height,
  },
  playbackContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: ICON_THUMB_1.height * 2.0,
    maxHeight: ICON_THUMB_1.height * 2.0,
  },
  playbackSlider: {
    alignSelf: 'stretch',
  },
  liveText: {
    color: LIVE_COLOR,
  },
  recordingTimestamp: {
    paddingLeft: 20,
  },
  playbackTimestamp: {
    textAlign: 'right',
    alignSelf: 'stretch',
    paddingRight: 20,
  },
  image: {
    backgroundColor: BACKGROUND_COLOR,
  },
  textButton: {
    backgroundColor: BACKGROUND_COLOR,
    padding: 10,
  },
  buttonsContainerBase: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonsContainerTopRow: {
    maxHeight: ICON_MUTED_BUTTON.height,
    alignSelf: 'stretch',
    paddingRight: 20,
  },
  playStopContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: ((ICON_PLAY_BUTTON.width + ICON_STOP_BUTTON.width) * 3.0) / 2.0,
    maxWidth: ((ICON_PLAY_BUTTON.width + ICON_STOP_BUTTON.width) * 3.0) / 2.0,
  },
  volumeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: DEVICE_WIDTH / 2.0,
    maxWidth: DEVICE_WIDTH / 2.0,
  },
  volumeSlider: {
    width: DEVICE_WIDTH / 2.0 - ICON_MUTED_BUTTON.width,
  },
  buttonsContainerBottomRow: {
    maxHeight: ICON_THUMB_1.height,
    alignSelf: 'stretch',
    paddingRight: 20,
    paddingLeft: 20,
  },
  rateSlider: {
    width: DEVICE_WIDTH / 2.0,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
  },
});
