import {
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState, useRef} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {OrientationLocker, LANDSCAPE} from 'react-native-orientation-locker';
import {getStream, Stream} from '../../lib/getStream';
import VideoPlayer from 'react-native-media-console';
import {useNavigation} from '@react-navigation/native';
import {ifExists} from '../../lib/file/ifExists';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  VideoRef,
  AudioTrack,
  TextTrack,
  SelectedAudioTrack,
  SelectedTextTrack,
  ResizeMode,
} from 'react-native-video';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

const Player = ({route}: Props): React.JSX.Element => {
  const playerRef: React.RefObject<VideoRef> = useRef(null);
  const [stream, setStream] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream>(stream[0]);

  // controls
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'audio' | 'subtitle' | 'video'>(
    'audio',
  );
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] =
    useState<SelectedAudioTrack>({type: 'index', value: '0'});
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [selectedTextTrack, setSelectedTextTrack] = useState<SelectedTextTrack>(
    {type: 'disabled'},
  );

  const navigation = useNavigation();
  useEffect(() => {
    const fetchStream = async () => {
      // check if downloaded
      if (route.params.file) {
        const exists = await ifExists(route.params.file);
        if (exists) {
          setStream([{server: 'downloaded', link: exists}]);
          setSelectedStream({server: 'downloaded', link: exists});
          return;
        }
      }
      const data = await getStream(route.params.link, route.params.type);
      setStream(data);
      setSelectedStream(data[0]);
      // console.log('st', data);
    };
    fetchStream();
  }, [route.params.link]);
  return (
    <View
      from={{opacity: 0}}
      animate={{opacity: 1}}
      //@ts-ignore
      transition={{type: 'timing', duration: 1000}}
      exit={{opacity: 0}}
      className="bg-black h-full w-full p-4 relative">
      <OrientationLocker orientation={LANDSCAPE} />
      <VideoPlayer
        source={{uri: selectedStream?.link}}
        videoRef={playerRef}
        poster={route.params.poster}
        title={route.params.title}
        navigator={navigation}
        seekColor="tomato"
        subtitleStyle={{fontSize: 20}}
        showDuration={true}
        toggleResizeModeOnFullscreen={true}
        fullscreen={true}
        onShowControls={() => setShowControls(true)}
        onHideControls={() => setShowControls(false)}
        rewindTime={10}
        isFullscreen={true}
        disableVolume={true}
        showHours={true}
        onError={e => {
          console.log('PlayerError', e);
          setSelectedStream(stream?.[1]);
          ToastAndroid.show(
            'could not play video try downloading',
            ToastAndroid.SHORT,
          );
        }}
        resizeMode={ResizeMode.NONE}
        //@ts-ignore
        selectedAudioTrack={selectedAudioTrack}
        onAudioTracks={e => {
          console.log('audioTracks', e.audioTracks);
          setAudioTracks(e.audioTracks);
        }}
        //@ts-ignore
        selectedTextTrack={selectedTextTrack}
        onTextTracks={e => {
          setTextTracks(e.textTracks);
        }}
      />
      {showControls && (
        <TouchableOpacity
          className="absolute top-5 right-5"
          onPress={() => {
            setShowSettings(!showSettings);
            playerRef?.current?.pause();
          }}>
          <MaterialIcons
            name="settings"
            size={30}
            color="white"
            style={{opacity: 0.7}}
          />
        </TouchableOpacity>
      )}
      {
        // settings
        showSettings && (
          <View
            className="absolute top-0 left-0 w-full h-full bg-black/50 justify-center items-center"
            onTouchEnd={() => {
              setShowSettings(false);
              playerRef?.current?.resume();
            }}>
            <View
              className="bg-quaternary p-3 w-96 max-h-72 rounded-md justify-center items-center"
              onTouchEnd={e => e.stopPropagation()}>
              {/* tab buttons */}
              <View className="flex-row justify-evenly items-center w-full border-b pb-2 border-white/50">
                <TouchableOpacity onPress={() => setActiveTab('audio')}>
                  <Text
                    className={`text-lg ${
                      activeTab === 'audio'
                        ? 'font-bold text-primary'
                        : 'font-normal'
                    }`}>
                    Audio
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('subtitle')}>
                  <Text
                    className={`text-lg ${
                      activeTab === 'subtitle'
                        ? 'font-bold text-primary'
                        : 'font-normal'
                    }`}>
                    Subtitle
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('video')}>
                  <Text
                    className={`text-lg ${
                      activeTab === 'video'
                        ? 'font-bold text-primary'
                        : 'font-normal text-white'
                    }`}>
                    Video
                  </Text>
                </TouchableOpacity>
              </View>
              {/* activeTab */}

              {/* audio */}
              {activeTab === 'audio' && (
                <ScrollView className="w-full p-3">
                  {audioTracks.map((track, i) => (
                    <TouchableOpacity
                      className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden"
                      key={i}
                      onPress={() => {
                        setSelectedAudioTrack({
                          type: 'language',
                          value: track.language,
                        });
                        setShowSettings(false);
                        playerRef?.current?.resume();
                      }}>
                      <Text
                        className={`text-base font-semibold ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.language}
                      </Text>
                      <Text
                        className={`text-base italic ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.type}
                      </Text>
                      <Text
                        className={`text-sm italic ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {/* subtitle */}
              {activeTab === 'subtitle' && (
                <ScrollView className="w-full p-3">
                  <TouchableOpacity
                    className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden"
                    onPress={() => {
                      setSelectedTextTrack({type: 'disabled'});
                      setShowSettings(false);
                      playerRef?.current?.resume();
                    }}>
                    <Text className="text-base font-semibold text-white">
                      Disabled
                    </Text>
                  </TouchableOpacity>
                  {textTracks.map((track, i) => (
                    <TouchableOpacity
                      className={
                        'flex-row gap-3 items-center text-primary rounded-md my-1 overflow-hidden'
                      }
                      key={i}
                      onPress={() => {
                        track.index === 0
                          ? setSelectedTextTrack({
                              type: 'language',
                              value: track.language,
                            })
                          : setSelectedTextTrack({
                              type: 'index',
                              value: track.index,
                            });
                        setShowSettings(false);
                        playerRef?.current?.resume();
                      }}>
                      <Text
                        className={`text-base font-semibold ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.language}
                      </Text>
                      <Text
                        className={`text-base italic ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.type}
                      </Text>
                      <Text
                        className={`text-sm italic text-white ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {/* video */}
              {activeTab === 'video' && (
                <ScrollView className="w-full p-3">
                  {stream
                    .filter(track => track.server !== 'hubcloud')
                    .map((track, i) => (
                      <TouchableOpacity
                        className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden"
                        key={i}
                        onPress={() => {
                          setSelectedStream(track);
                          setShowSettings(false);
                          playerRef?.current?.resume();
                        }}>
                        <Text
                          className={`text-base font-semibold ${
                            track.link === selectedStream.link
                              ? 'text-primary'
                              : 'text-white'
                          }`}>
                          {track.server}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              )}
            </View>
          </View>
        )
      }
    </View>
  );
};

export default Player;
