import {FFmpegKit, FFprobeKit, ReturnCode} from 'ffmpeg-kit-react-native';
import notifee from '@notifee/react-native';
import {Downloads} from './zustand/downloadsStore';

const getVideoDuration = async (videoUrl: string) => {
  const information = await FFprobeKit.getMediaInformation(videoUrl);
  const output = await information.getOutput();
  const jsonOutput = JSON.parse(output);
  console.log('Output: 🔥🔥🔥', jsonOutput.format.duration);
  const duration = parseFloat(jsonOutput.format.duration);
  return duration;
};

export const hlsDownloader = async ({
  videoUrl,
  path,
  fileName,
  title,
  downloadStore,
  setAlreadyDownloaded,
  setDownloadId,
}: {
  videoUrl: string;
  path: string;
  fileName: string;
  title: string;
  downloadStore: Downloads;
  setAlreadyDownloaded: (value: boolean) => void;
  setDownloadId: (value: number) => void;
}) => {
  const command = `-i ${videoUrl} -c copy -bsf:a aac_adtstoasc -f mp4 ${path}`;
  const channelId = await notifee.createChannel({
    id: 'download',
    name: 'Download Notifications',
  });
  try {
    const duration = await getVideoDuration(videoUrl);
    await FFmpegKit.executeAsync(
      command,
      async session => {
        console.log(
          'FFmpeg process started with sessionId: ' + session.getSessionId(),
        );

        const returnCode = await session.getReturnCode();

        if (ReturnCode.isSuccess(returnCode)) {
          // If download was successful, move the downloaded file into the devices library
          console.log('Download successful');
          setAlreadyDownloaded(true);
          downloadStore.removeActiveDownload(fileName);
          await notifee.cancelNotification(fileName);
          await notifee.displayNotification({
            title: 'Download completed',
            body: `Downloaded ${title}`,
            android: {
              color: '#FF6347',
              smallIcon: 'ic_notification',
              channelId,
            },
          });
        } else {
          setAlreadyDownloaded(false);
          downloadStore.removeActiveDownload(fileName);
          console.log('Download failed');
          await notifee.cancelNotification(fileName);
          await notifee.displayNotification({
            title: 'Download failed',
            body: `Failed to download ${title}`,
            android: {
              color: '#FF6347',
              smallIcon: 'ic_notification',
              channelId,
            },
          });
        }
      },
      async log => {
        const message = log.getMessage();
        const regex = /time=(\d{2}:\d{2}:\d{2}.\d{2})/;
        const currentTime = regex.exec(message as string);
        if (currentTime && currentTime[1]) {
          const currentTimeInSeconds =
            parseInt(currentTime[1].split(':')[0]) * 3600 +
            parseInt(currentTime[1].split(':')[1]) * 60 +
            parseFloat(currentTime[1].split(':')[2]);
          const progress = (currentTimeInSeconds / duration) * 100;
          console.log('Progress: ', currentTimeInSeconds, duration, progress);
          setDownloadId(log.getSessionId());
          await notifee.displayNotification({
            title: title,
            body: `Downloaded ${progress.toFixed(2)}%`,
            id: fileName,
            data: {fileName, jobId: log.getSessionId()},
            android: {
              smallIcon: 'ic_notification',
              onlyAlertOnce: true,
              progress: {
                max: 100,
                current: progress > 100 ? 100 : progress,
              },
              color: '#FF6347',
              channelId,
              actions: [
                {
                  title: 'Cancel',
                  pressAction: {
                    id: fileName,
                  },
                },
              ],
            },
          });
        }
      },
    );
  } catch (error) {
    setAlreadyDownloaded(false);
    downloadStore.removeActiveDownload(fileName);
    console.log('Error downloading', error);
    await notifee.displayNotification({
      title: 'Download failed',
      body: `Failed to download ${fileName}`,
      android: {
        color: '#FF6347',
        smallIcon: 'ic_notification',
        channelId,
      },
    });
  }
};
