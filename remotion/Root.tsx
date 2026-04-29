import {Composition} from 'remotion';
import {CardSnapUgcAd} from './CardSnapUgcAd';

export const RemotionRoot = () => {
  return (
    <Composition
      id="CardSnapUGCAd"
      component={CardSnapUgcAd}
      durationInFrames={990}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
