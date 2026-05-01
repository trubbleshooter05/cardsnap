import type {CSSProperties, ReactNode} from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FakeSportsCard} from './components/FakeSportsCard';
import {PhoneMockup} from './components/PhoneMockup';
import {TikTokCaption} from './components/TikTokCaption';
import {WarningLabel} from './components/WarningLabel';
import {colors, fill, fontStack, shadow} from './styles';

type PsaTone = 'psaFunny' | 'psaAngry' | 'psaCalm';

type PsaScene = {
  duration: number;
  caption: string;
  emphasis?: string;
  bug: string;
  bg: string;
  layout: 'talk' | 'phone' | 'values' | 'receipt' | 'checklist' | 'cta';
  labels?: string[];
};

const fps = 30;

const psaScripts: Record<
  PsaTone,
  {
    audio: string;
    scenes: PsaScene[];
  }
> = {
  psaFunny: {
    audio: 'audio/cardsnap-psa9-ugc-funny-elevenlabs.mp3',
    scenes: [
      {
        duration: 90,
        caption: 'I almost paid $25 to learn PSA 9 exists.',
        emphasis: '$25',
        bug: 'psa 9 lesson',
        bg: '#fff4de',
        layout: 'talk',
        labels: ['oops', 'fee math'],
      },
      {
        duration: 102,
        caption: 'This was going straight to grading. No math. Just confidence.',
        emphasis: 'No math',
        bug: 'too confident',
        bg: '#eaf3ff',
        layout: 'phone',
      },
      {
        duration: 92,
        caption: 'Then I checked it in CardSnap.',
        emphasis: 'CardSnap',
        bug: 'run the math',
        bg: '#ffe9e6',
        layout: 'talk',
      },
      {
        duration: 128,
        caption: 'CardSnap showed raw, PSA 9, PSA 10, and the grading fee.',
        emphasis: 'PSA 9',
        bug: 'do the math',
        bg: '#f4f7fb',
        layout: 'values',
      },
      {
        duration: 138,
        caption: 'If it came back PSA 9, I paid money to make it less exciting.',
        emphasis: 'paid money',
        bug: 'bad submit',
        bg: '#fff7dc',
        layout: 'receipt',
      },
      {
        duration: 118,
        caption: 'Now I check CardSnap before I submit anything.',
        emphasis: 'before',
        bug: 'check first',
        bg: '#10151d',
        layout: 'phone',
      },
      {
        duration: 120,
        caption: 'Because vibes are not a grading strategy.',
        emphasis: 'before',
        bug: 'check first',
        bg: '#111111',
        layout: 'cta',
      },
      {
        duration: 108,
        caption: 'Check before you grade.',
        emphasis: 'before',
        bug: 'use cardsnap',
        bg: '#111111',
        layout: 'cta',
      },
    ],
  },
  psaAngry: {
    audio: 'audio/cardsnap-psa9-ugc-angry-elevenlabs.mp3',
    scenes: [
      {
        duration: 118,
        caption: 'PSA 10 comps are how collectors get tricked.',
        emphasis: 'tricked',
        bug: 'stop doing this',
        bg: '#ff3b30',
        layout: 'talk',
        labels: ['fee gone'],
      },
      {
        duration: 136,
        caption: 'I used to look up PSA 10 prices and immediately think, send it.',
        emphasis: 'PSA 10',
        bug: 'wrong move',
        bg: '#fff4de',
        layout: 'phone',
      },
      {
        duration: 122,
        caption: 'The real question is: what happens if it comes back PSA 9?',
        emphasis: 'PSA 9',
        bug: 'downside first',
        bg: '#10151d',
        layout: 'values',
      },
      {
        duration: 150,
        caption: 'CardSnap shows raw value, PSA 9, PSA 10, and estimated grading costs.',
        emphasis: 'costs',
        bug: 'all-in math',
        bg: '#f4f7fb',
        layout: 'checklist',
      },
      {
        duration: 138,
        caption: 'This card looked profitable until I saw the PSA 9 downside.',
        emphasis: 'PSA 9',
        bug: 'not profitable',
        bg: '#fff7dc',
        layout: 'values',
      },
      {
        duration: 132,
        caption: 'I almost threw away the grading fee for no reason.',
        emphasis: 'threw away',
        bug: 'fee fire',
        bg: '#ffe9e6',
        layout: 'receipt',
      },
      {
        duration: 138,
        caption: 'If you grade cards, check the ROI before you submit.',
        emphasis: 'before',
        bug: 'use cardsnap',
        bg: '#111111',
        layout: 'cta',
      },
      {
        duration: 154,
        caption: 'Check the downside first.',
        emphasis: 'downside',
        bug: 'use cardsnap',
        bg: '#111111',
        layout: 'cta',
      },
    ],
  },
  psaCalm: {
    audio: 'audio/cardsnap-psa9-ugc-calm-elevenlabs.mp3',
    scenes: [
      {
        duration: 94,
        caption: 'Here is the math I check before grading any card.',
        emphasis: 'before',
        bug: 'simple rule',
        bg: '#eaf3ff',
        layout: 'talk',
      },
      {
        duration: 88,
        caption: 'First, what is it worth raw?',
        emphasis: 'raw',
        bug: 'step one',
        bg: '#fff4de',
        layout: 'phone',
      },
      {
        duration: 100,
        caption: 'Then, what does it sell for as a PSA 9?',
        emphasis: 'PSA 9',
        bug: 'downside',
        bg: '#f4f7fb',
        layout: 'values',
      },
      {
        duration: 98,
        caption: 'Then, what is the PSA 10 upside?',
        emphasis: 'PSA 10',
        bug: 'upside',
        bg: '#fff7dc',
        layout: 'values',
      },
      {
        duration: 112,
        caption: 'After that, I subtract the grading fee.',
        emphasis: 'fee',
        bug: 'fees matter',
        bg: '#fff7dc',
        layout: 'checklist',
      },
      {
        duration: 116,
        caption: 'CardSnap puts all of that in one place.',
        emphasis: 'one place',
        bug: 'roi math',
        bg: '#10151d',
        layout: 'phone',
      },
      {
        duration: 92,
        caption: 'PSA 10 comps look great, but PSA 9 can lose money.',
        emphasis: 'lose money',
        bug: 'psa 9 risk',
        bg: '#ffe9e6',
        layout: 'values',
      },
      {
        duration: 80,
        caption: 'I check CardSnap first, then decide if it is worth grading.',
        emphasis: 'first',
        bug: 'avoid the fee',
        bg: '#111111',
        layout: 'cta',
      },
    ],
  },
};

const sceneBase: CSSProperties = {
  ...fill,
  overflow: 'hidden',
  fontFamily: fontStack,
  background: colors.paper,
};

const durationFor = (tone: PsaTone) =>
  psaScripts[tone].scenes.reduce((sum, scene) => sum + scene.duration, 0);

export const CARD_SNAP_PSA_UGC_DURATIONS = {
  psaFunny: durationFor('psaFunny'),
  psaAngry: durationFor('psaAngry'),
  psaCalm: durationFor('psaCalm'),
};

const JumpCut = ({children, bg}: {children: ReactNode; bg: string}) => (
  <AbsoluteFill style={{...sceneBase, background: bg}}>{children}</AbsoluteFill>
);

const TopBug = ({text}: {text: string}) => (
  <div
    style={{
      position: 'absolute',
      top: 64,
      left: 58,
      right: 58,
      display: 'flex',
      justifyContent: 'space-between',
      color: colors.ink,
      fontSize: 27,
      fontWeight: 950,
      textTransform: 'uppercase',
      zIndex: 20,
    }}
  >
    <span>{text}</span>
    <span style={{color: colors.red}}>REC</span>
  </div>
);

const Creator = ({tone}: {tone: PsaTone}) => {
  const frame = useCurrentFrame();
  const wobble = Math.sin(frame / 10) * 4;
  const shirt = tone === 'psaAngry' ? colors.red : tone === 'psaCalm' ? colors.green : colors.blue;

  return (
    <div style={{position: 'absolute', left: 98, top: 210 + wobble, width: 880, height: 900}}>
      <div
        style={{
          position: 'absolute',
          left: 212,
          top: 72,
          width: 470,
          height: 470,
          borderRadius: '50%',
          background: '#f4c18b',
          border: '8px solid #111',
          boxShadow: '16px 18px 0 rgba(0,0,0,0.18)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 250,
          top: 38,
          width: 395,
          height: 150,
          borderRadius: '150px 150px 70px 70px',
          background: '#232323',
          border: '8px solid #111',
        }}
      />
      <div style={{position: 'absolute', left: 338, top: 280, width: 48, height: 48, borderRadius: '50%', background: '#111'}} />
      <div style={{position: 'absolute', left: 520, top: 280, width: 48, height: 48, borderRadius: '50%', background: '#111'}} />
      <div style={{position: 'absolute', left: 382, top: 412, width: 152, height: tone === 'psaAngry' ? 48 : 64, borderRadius: 999, background: '#111'}} />
      <div
        style={{
          position: 'absolute',
          left: 130,
          top: 525,
          width: 640,
          height: 440,
          borderRadius: '90px 90px 0 0',
          background: shirt,
          border: '8px solid #111',
        }}
      />
    </div>
  );
};

const Values = () => (
  <div
    style={{
      position: 'absolute',
      left: 85,
      right: 85,
      top: 275,
      padding: 42,
      borderRadius: 34,
      background: '#fff',
      border: '6px solid #111',
      boxShadow: shadow,
    }}
  >
    <div style={{fontSize: 48, fontWeight: 950, marginBottom: 28}}>The part people skip</div>
    {[
      ['Raw today', '$60', colors.orange],
      ['PSA 9 after fees', '-$30', colors.red],
      ['PSA 10 upside', '+$75', colors.green],
    ].map(([label, value, color], index) => (
      <div
        key={label}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 190px',
          gap: 18,
          alignItems: 'center',
          padding: '28px 0',
          borderTop: index === 0 ? 'none' : '4px solid #eee',
          fontSize: 44,
          fontWeight: 930,
        }}
      >
        <span>{label}</span>
        <span style={{color, textAlign: 'right'}}>{value}</span>
      </div>
    ))}
    <WarningLabel style={{left: 90, top: 560}}>PSA 9 can lose money</WarningLabel>
  </div>
);

const Receipt = () => (
  <div
    style={{
      position: 'absolute',
      left: 135,
      top: 300,
      width: 810,
      padding: 48,
      background: '#fff',
      border: '6px solid #111',
      boxShadow: '14px 16px 0 rgba(0,0,0,0.2)',
      transform: 'rotate(-2deg)',
    }}
  >
    {[
      ['grading fee', '$25'],
      ['shipping', '$15'],
      ['PSA 9 spread', '$15'],
      ['net result', '-$25'],
    ].map(([label, value]) => (
      <div key={label} style={{display: 'flex', justifyContent: 'space-between', borderBottom: '4px dashed #ddd', padding: '24px 0', fontSize: 46, fontWeight: 900}}>
        <span>{label}</span>
        <span style={{color: value.startsWith('-') ? colors.red : colors.ink}}>{value}</span>
      </div>
    ))}
    <WarningLabel style={{left: 85, top: 650}}>fee ate the upside</WarningLabel>
  </div>
);

const Checklist = () => (
  <div
    style={{
      position: 'absolute',
      left: 90,
      right: 90,
      top: 285,
      padding: 42,
      borderRadius: 34,
      background: '#fff',
      border: '6px solid #111',
      boxShadow: shadow,
    }}
  >
    <div style={{fontSize: 46, fontWeight: 950, marginBottom: 28}}>Before grading</div>
    {['Raw value', 'PSA 9 downside', 'PSA 10 upside', 'Fees + shipping'].map((item, index) => (
      <div key={item} style={{display: 'flex', alignItems: 'center', gap: 22, padding: '22px 0', borderTop: index === 0 ? 'none' : '4px solid #eee', fontSize: 44, fontWeight: 900}}>
        <span style={{width: 48, height: 48, borderRadius: 999, background: colors.green, border: '5px solid #111'}} />
        <span>{item}</span>
      </div>
    ))}
  </div>
);

const SceneVisual = ({scene, tone}: {scene: PsaScene; tone: PsaTone}) => {
  if (scene.layout === 'talk') {
    return (
      <>
        <Creator tone={tone} />
        <FakeSportsCard style={{position: 'absolute', right: 72, top: 450, transform: 'scale(0.9) rotate(5deg)'}} />
        {(scene.labels ?? []).map((label, index) => (
          <WarningLabel key={label} style={{left: index % 2 ? 620 : 80, top: 1100 + index * 110}}>
            {label}
          </WarningLabel>
        ))}
      </>
    );
  }

  if (scene.layout === 'phone') {
    return (
      <>
        <PhoneMockup mode={tone === 'psaCalm' ? 'result' : 'input'} style={{position: 'absolute', left: 280, top: 170, transform: 'scale(0.95)'}} />
        <FakeSportsCard style={{position: 'absolute', right: 72, top: 1010, transform: 'scale(0.72) rotate(6deg)'}} />
      </>
    );
  }

  if (scene.layout === 'values') return <Values />;
  if (scene.layout === 'receipt') return <Receipt />;
  if (scene.layout === 'checklist') return <Checklist />;

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #111 0%, #1d252c 58%, #111 100%)'}}>
      <PhoneMockup mode="result" style={{position: 'absolute', left: 280, top: 170, transform: 'scale(0.92)'}} />
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: 1275,
          padding: 38,
          borderRadius: 28,
          background: '#fff',
          border: '6px solid #111',
          textAlign: 'center',
          color: colors.ink,
          fontSize: 68,
          lineHeight: 1.02,
          fontWeight: 950,
          boxShadow: '0 20px 70px rgba(0,0,0,0.35)',
        }}
      >
        Check PSA 9 first.
      </div>
    </AbsoluteFill>
  );
};

export const CardSnapPsaUgcAd = ({tone}: {tone: PsaTone}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const endFade = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const spec = psaScripts[tone];
  let cursor = 0;

  return (
    <AbsoluteFill style={{background: colors.paper, opacity: endFade}}>
      <Audio src={staticFile(spec.audio)} volume={1} />
      <Audio src={staticFile('audio/cardsnap-ugc-music.wav')} volume={0.06} />
      {spec.scenes.map((scene, index) => {
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence key={`${tone}-${index}`} from={from} durationInFrames={scene.duration}>
            <JumpCut bg={scene.bg}>
              <TopBug text={scene.bug} />
              <SceneVisual scene={scene} tone={tone} />
              <TikTokCaption
                text={scene.caption}
                emphasis={scene.emphasis}
                style={{
                  bottom: scene.layout === 'cta' ? 158 : 150,
                  fontSize: scene.caption.length > 58 ? 58 : 68,
                }}
              />
            </JumpCut>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const PSA_UGC_FPS = fps;
