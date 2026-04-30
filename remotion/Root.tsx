import {Composition} from 'remotion';
import {CARD_SNAP_UGC_DURATIONS, CardSnapUgcAd, UGC_FPS} from './CardSnapUgcAd';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CardSnapUGCAdFunny"
        component={CardSnapUgcAd}
        durationInFrames={CARD_SNAP_UGC_DURATIONS.funny}
        fps={UGC_FPS}
        width={1080}
        height={1920}
        defaultProps={{tone: 'funny'}}
      />
      <Composition
        id="CardSnapUGCAdAngry"
        component={CardSnapUgcAd}
        durationInFrames={CARD_SNAP_UGC_DURATIONS.angry}
        fps={UGC_FPS}
        width={1080}
        height={1920}
        defaultProps={{tone: 'angry'}}
      />
      <Composition
        id="CardSnapUGCAdUrgent"
        component={CardSnapUgcAd}
        durationInFrames={CARD_SNAP_UGC_DURATIONS.urgent}
        fps={UGC_FPS}
        width={1080}
        height={1920}
        defaultProps={{tone: 'urgent'}}
      />
    </>
  );
};
