import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Slider from '../../components/Slider';
import React, {useEffect, useState} from 'react';
import Hero from '../../components/Hero';
import {View} from 'moti';
import {getHomePageData, HomePageData} from '../../lib/getHomepagedata';
import {MMKV, MmmkvCache} from '../../lib/Mmkv';
import useContentStore from '../../lib/zustand/contentStore';
import useHeroStore from '../../lib/zustand/herostore';
import {manifest} from '../../lib/Manifest';
import notifee, {EventDetail, EventType} from '@notifee/react-native';
import RNFS from 'react-native-fs';
import useDownloadsStore from '../../lib/zustand/downloadsStore';
import {FFmpegKit} from 'ffmpeg-kit-react-native';
import useWatchHistoryStore from '../../lib/zustand/watchHistrory';
import Touturial from '../../components/Touturial';
import {downloadFolder} from '../../lib/constants';

const Home = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [homeData, setHomeData] = useState<HomePageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const downloadStore = useDownloadsStore(state => state);
  const recentlyWatched = useWatchHistoryStore(state => state).history;
  const ShowRecentlyWatched = MMKV.getBool('showRecentlyWatched');

  const {provider} = useContentStore(state => state);
  const {setHero} = useHeroStore(state => state);

  // change status bar color
  const handleScroll = (event: any) => {
    setBackgroundColor(
      event.nativeEvent.contentOffset.y > 0 ? 'black' : 'transparent',
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetchHomeData = async () => {
      setLoading(true);
      setHero({link: '', image: '', title: ''});
      const cache = MmmkvCache.getString('homeData' + provider.value);
      // console.log('cache', cache);
      if (cache) {
        const data = JSON.parse(cache as string);
        setHomeData(data);
        // pick random post form random category
        const randomPost =
          data[data?.length - 1].Posts[
            Math.floor(Math.random() * data[data?.length - 1].Posts.length)
          ];
        setHero(randomPost);

        setLoading(false);
      }
      const data = await getHomePageData(provider, signal);
      if (!cache && data.length > 0) {
        const randomPost =
          data[data?.length - 1].Posts[
            Math.floor(Math.random() * data[data?.length - 1].Posts.length)
          ];
        setHero(randomPost);
      }

      if (
        data[data?.length - 1].Posts.length === 0 ||
        data[0].Posts.length === 0
      ) {
        return;
      }
      setLoading(false);
      setHomeData(data);
      MmmkvCache.setString('homeData' + provider.value, JSON.stringify(data));
    };
    fetchHomeData();
    return () => {
      controller.abort();
    };
  }, [refreshing, provider]);

  async function actionHandler({
    type,
    detail,
  }: {
    type: EventType;
    detail: EventDetail;
  }) {
    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === detail.notification?.data?.fileName
    ) {
      console.log('Cancel download');
      RNFS.stopDownload(Number(detail.notification?.data?.jobId));
      FFmpegKit.cancel(Number(detail.notification?.data?.jobId));
      // setAlreadyDownloaded(false);
      downloadStore.removeActiveDownload(detail.notification?.data?.fileName!);
      try {
        const files = await RNFS.readDir(downloadFolder);
        // Find a file with the given name (without extension)
        const file = files.find(file => {
          const nameWithoutExtension = file.name
            .split('.')
            .slice(0, -1)
            .join('.');
          return nameWithoutExtension === detail.notification?.data?.fileName;
        });
        if (file) {
          await RNFS.unlink(file.path);
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
  notifee.onBackgroundEvent(actionHandler);
  notifee.onForegroundEvent(actionHandler);
  return (
    <SafeAreaView className="bg-black h-full w-full">
      <Touturial />
      <StatusBar
        showHideTransition={'fade'}
        animated={true}
        translucent={true}
        backgroundColor={backgroundColor}
      />
      <ScrollView
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            colors={['tomato']}
            tintColor="tomato"
            progressBackgroundColor={'black'}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 1000);
            }}
          />
        }>
        <Hero />
        <View className="p-4">
          {!loading && recentlyWatched?.length > 0 && ShowRecentlyWatched && (
            <Slider
              isLoading={loading}
              title={'Recently Watched'}
              posts={recentlyWatched}
              filter={''}
            />
          )}
          {loading
            ? manifest[provider.value].catalog.map((item, index) => (
                <Slider
                  isLoading={loading}
                  key={index}
                  title={item.title}
                  posts={[]}
                  filter={item.filter}
                />
              ))
            : homeData.map((item, index) => (
                <Slider
                  isLoading={loading}
                  key={index}
                  title={item.title}
                  posts={item.Posts}
                  filter={item.filter}
                />
              ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
