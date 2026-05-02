import {Composition} from 'remotion';
import {CARD_SNAP_UGC_DURATIONS, CardSnapUgcAd, UGC_FPS} from './CardSnapUgcAd';
import {
  CARD_SNAP_PSA_UGC_DURATIONS,
  CardSnapPsaUgcAd,
  PSA_UGC_FPS,
} from './CardSnapPsaUgcAd';
import {
  CARD_SNAP_SEARCH_UGC_DURATIONS,
  CardSnapSearchUgcBatch,
  SEARCH_UGC_FPS,
} from './CardSnapSearchUgcBatch';

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
      <Composition
        id="CardSnapPsaUGCFunny"
        component={CardSnapPsaUgcAd}
        durationInFrames={CARD_SNAP_PSA_UGC_DURATIONS.psaFunny}
        fps={PSA_UGC_FPS}
        width={1080}
        height={1920}
        defaultProps={{tone: 'psaFunny'}}
      />
      <Composition
        id="CardSnapPsaUGCAngry"
        component={CardSnapPsaUgcAd}
        durationInFrames={CARD_SNAP_PSA_UGC_DURATIONS.psaAngry}
        fps={PSA_UGC_FPS}
        width={1080}
        height={1920}
        defaultProps={{tone: 'psaAngry'}}
      />
      <Composition
        id="CardSnapPsaUGCCalm"
        component={CardSnapPsaUgcAd}
        durationInFrames={CARD_SNAP_PSA_UGC_DURATIONS.psaCalm}
        fps={PSA_UGC_FPS}
        width={1080}
        height={1920}
        defaultProps={{tone: 'psaCalm'}}
      />
      <Composition
        id="CardSnapSearchUGCPrintLines"
        component={CardSnapSearchUgcBatch}
        durationInFrames={CARD_SNAP_SEARCH_UGC_DURATIONS.printLines}
        fps={SEARCH_UGC_FPS}
        width={1080}
        height={1920}
        defaultProps={{tone: 'printLines'}}
      />
      <Composition
        id="CardSnapSearchUGCGradeEstimate"
        component={CardSnapSearchUgcBatch}
        durationInFrames={CARD_SNAP_SEARCH_UGC_DURATIONS.gradeEstimate}
        fps={SEARCH_UGC_FPS}
        width={1080}
        height={1920}
        defaultProps={{tone: 'gradeEstimate'}}
      />
      <Composition
        id="CardSnapSearchUGCHockey"
        component={CardSnapSearchUgcBatch}
        durationInFrames={CARD_SNAP_SEARCH_UGC_DURATIONS.hockey}
        fps={SEARCH_UGC_FPS}
        width={1080}
        height={1920}
        defaultProps={{tone: 'hockey'}}
      />
    </>
  );
};
