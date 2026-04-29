import {Audio, staticFile} from 'remotion';

export const UgcAudioBed = () => {
  return (
    <>
      <Audio
        src={staticFile('audio/cardsnap-ugc-music.wav')}
        volume={0.12}
      />
      <Audio
        src={staticFile('audio/cardsnap-ugc-voiceover.mp3')}
        volume={1.15}
      />
    </>
  );
};
