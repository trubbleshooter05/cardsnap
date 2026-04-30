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

type Tone = 'funny' | 'angry' | 'urgent';

type Scene = {
  duration: number;
  caption: string;
  emphasis?: string;
  bug: string;
  bg: string;
  layout: 'talk-card' | 'receipt' | 'phone-input' | 'phone-analyze' | 'values' | 'phone-result' | 'cta';
  labels?: string[];
};

const fps = 30;

const scripts: Record<
  Tone,
  {
    title: string;
    audio: string;
    targetFrames: number;
    scenes: Scene[];
  }
> = {
  funny: {
    title: 'funny tone',
    audio: 'audio/cardsnap-ugc-funny-elevenlabs.mp3',
    targetFrames: 1020,
    scenes: [
      {
        duration: 60,
        caption: 'I almost paid $25 to disappoint myself.',
        emphasis: '$25',
        bug: 'almost wasted it',
        bg: '#fff4de',
        layout: 'talk-card',
        labels: ['grading fee?', 'why tho'],
      },
      {
        duration: 96,
        caption: "I was like, 'this one is definitely worth grading.'",
        emphasis: 'definitely',
        bug: 'zero evidence',
        bg: '#eaf3ff',
        layout: 'talk-card',
        labels: ['looked clean'],
      },
      {
        duration: 48,
        caption: 'Fully confident. Zero evidence.',
        emphasis: 'Zero',
        bug: 'collector logic',
        bg: '#ffe9e6',
        layout: 'receipt',
        labels: ['confidence: 100%', 'math: 0%'],
      },
      {
        duration: 60,
        caption: 'Then I checked it in CardSnap.',
        emphasis: 'CardSnap',
        bug: 'run the math',
        bg: '#10151d',
        layout: 'phone-input',
      },
      {
        duration: 132,
        caption: 'It showed raw value, PSA 9, PSA 10, fees, and the actual math.',
        emphasis: 'actual math',
        bug: 'not vibes',
        bg: '#f4f7fb',
        layout: 'phone-analyze',
        labels: ['raw comps', 'PSA 9', 'PSA 10', 'fees'],
      },
      {
        duration: 108,
        caption: 'If it came back PSA 9, I basically paid money to be sad.',
        emphasis: 'paid money',
        bug: 'PSA 9 trap',
        bg: '#fff7dc',
        layout: 'values',
      },
      {
        duration: 72,
        caption: 'Saved myself from a bad submission.',
        emphasis: 'Saved',
        bug: 'fee avoided',
        bg: '#eafff0',
        layout: 'phone-result',
        labels: ['$25 saved'],
      },
      {
        duration: 84,
        caption: 'Now I check CardSnap before I submit anything.',
        emphasis: 'before',
        bug: 'check before grading',
        bg: '#111111',
        layout: 'cta',
      },
    ],
  },
  angry: {
    title: 'angry tone',
    audio: 'audio/cardsnap-ugc-angry-elevenlabs.mp3',
    targetFrames: 1200,
    scenes: [
      {
        duration: 72,
        caption: 'This is the mistake that costs card collectors money.',
        emphasis: 'costs',
        bug: 'stop losing fees',
        bg: '#ffe9e6',
        layout: 'talk-card',
        labels: ['bad submission', 'fee gone'],
      },
      {
        duration: 108,
        caption: 'I used to just look up PSA 10 prices and think, yep, send it.',
        emphasis: 'PSA 10',
        bug: 'wrong question',
        bg: '#fff4de',
        layout: 'phone-input',
      },
      {
        duration: 126,
        caption: 'But the real question is: what if it comes back PSA 9?',
        emphasis: 'PSA 9',
        bug: 'the downside',
        bg: '#10151d',
        layout: 'values',
      },
      {
        duration: 132,
        caption: 'CardSnap shows raw value, PSA 9 value, PSA 10 value, and grading costs.',
        emphasis: 'grading costs',
        bug: 'all-in math',
        bg: '#f4f7fb',
        layout: 'phone-analyze',
        labels: ['raw', 'PSA 9', 'PSA 10', 'fees'],
      },
      {
        duration: 108,
        caption: 'This card looked profitable until I saw the PSA 9 math.',
        emphasis: 'looked profitable',
        bug: 'not so fast',
        bg: '#fff7dc',
        layout: 'receipt',
        labels: ['PSA 10 dream', 'PSA 9 reality'],
      },
      {
        duration: 96,
        caption: 'I almost lit the grading fee on fire.',
        emphasis: 'on fire',
        bug: 'fee mistake',
        bg: '#ff3b30',
        layout: 'talk-card',
        labels: ['money lost'],
      },
      {
        duration: 120,
        caption: 'If you grade cards, check the ROI before you submit.',
        emphasis: 'before',
        bug: 'check ROI first',
        bg: '#111111',
        layout: 'cta',
      },
    ],
  },
  urgent: {
    title: 'high urgency',
    audio: 'audio/cardsnap-ugc-urgent-elevenlabs.mp3',
    targetFrames: 810,
    scenes: [
      {
        duration: 60,
        caption: 'Stop. This is how grading fees disappear.',
        emphasis: 'disappear',
        bug: 'stop scrolling',
        bg: '#ff3b30',
        layout: 'talk-card',
        labels: ['$25 gone'],
      },
      {
        duration: 96,
        caption: 'I almost sent this in because PSA 10 comps looked huge.',
        emphasis: 'huge',
        bug: 'PSA 10 bait',
        bg: '#fff4de',
        layout: 'phone-input',
      },
      {
        duration: 60,
        caption: 'CardSnap showed me the part I was ignoring.',
        emphasis: 'ignoring',
        bug: 'hidden risk',
        bg: '#10151d',
        layout: 'phone-analyze',
      },
      {
        duration: 84,
        caption: 'Raw value. PSA 9. PSA 10. Fees. Net upside.',
        emphasis: 'Fees',
        bug: 'the math',
        bg: '#f4f7fb',
        layout: 'values',
      },
      {
        duration: 78,
        caption: 'The verdict: only worth it if it gems.',
        emphasis: 'only',
        bug: 'gem or bust',
        bg: '#fff7dc',
        layout: 'phone-result',
      },
      {
        duration: 96,
        caption: 'That is the kind of card that eats your grading fee.',
        emphasis: 'eats',
        bug: 'fee eater',
        bg: '#ffe9e6',
        layout: 'receipt',
        labels: ['PSA 9 downside'],
      },
      {
        duration: 126,
        caption: 'Run it through CardSnap before you submit.',
        emphasis: 'before',
        bug: 'use cardsnap first',
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

const totalFrames = (tone: Tone) => scripts[tone].targetFrames;

const scaledSceneDurations = (tone: Tone) => {
  const spec = scripts[tone];
  const baseFrames = spec.scenes.reduce((sum, scene) => sum + scene.duration, 0);
  let usedFrames = 0;

  return spec.scenes.map((scene, index) => {
    if (index === spec.scenes.length - 1) {
      return spec.targetFrames - usedFrames;
    }

    const scaledDuration = Math.max(
      1,
      Math.round((scene.duration / baseFrames) * spec.targetFrames)
    );
    usedFrames += scaledDuration;
    return scaledDuration;
  });
};

export const CARD_SNAP_UGC_DURATIONS = {
  funny: totalFrames('funny'),
  angry: totalFrames('angry'),
  urgent: totalFrames('urgent'),
};

const JumpCut = ({
  children,
  bg = colors.paper,
}: {
  children: ReactNode;
  bg?: string;
}) => (
  <AbsoluteFill
    style={{
      ...sceneBase,
      background: bg,
    }}
  >
    {children}
  </AbsoluteFill>
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
      alignItems: 'center',
      color: colors.ink,
      fontSize: 27,
      fontWeight: 950,
      letterSpacing: 0,
      textTransform: 'uppercase',
      zIndex: 20,
    }}
  >
    <span>{text}</span>
    <span style={{color: colors.red}}>REC</span>
  </div>
);

const TalkingHead = ({mood}: {mood: Tone}) => {
  const frame = useCurrentFrame();
  const y = Math.sin(frame / 9) * 5;
  const mouthHeight = mood === 'angry' ? 42 : mood === 'urgent' ? 76 : 60;

  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        top: 205 + y,
        width: 860,
        height: 940,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 190,
          top: 80,
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: '#f6c692',
          border: '8px solid #111',
          boxShadow: '16px 18px 0 rgba(0,0,0,0.18)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 238,
          top: 42,
          width: 386,
          height: 155,
          borderRadius: '150px 150px 60px 60px',
          background: '#272727',
          border: '8px solid #111',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 318,
          top: 286,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#111',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 286,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#111',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 360,
          top: 405,
          width: 150,
          height: mouthHeight,
          borderRadius: mood === 'angry' ? 999 : '0 0 90px 90px',
          background: mood === 'angry' ? '#111' : 'transparent',
          borderBottom: mood === 'angry' ? 'none' : '12px solid #111',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 112,
          top: 530,
          width: 640,
          height: 440,
          borderRadius: '90px 90px 0 0',
          background: mood === 'angry' ? colors.red : colors.blue,
          border: '8px solid #111',
        }}
      />
    </div>
  );
};

const Receipt = ({labels = []}: {labels?: string[]}) => (
  <div
    style={{
      position: 'absolute',
      left: 135,
      top: 270,
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
      ['PSA 9 net', '-$15'],
      ['bad submit', 'ouch'],
    ].map(([label, value]) => (
      <div
        key={label}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '4px dashed #ddd',
          padding: '24px 0',
          fontSize: 46,
          fontWeight: 900,
        }}
      >
        <span>{label}</span>
        <span style={{color: value.startsWith('-') ? colors.red : colors.ink}}>
          {value}
        </span>
      </div>
    ))}
    {labels.map((label, index) => (
      <WarningLabel
        key={label}
        style={{left: index % 2 ? 420 : 90, top: 640 + index * 95}}
        delay={index * 8}
      >
        {label}
      </WarningLabel>
    ))}
  </div>
);

const ValuesPanel = () => (
  <div
    style={{
      position: 'absolute',
      left: 90,
      right: 90,
      top: 285,
      padding: 42,
      borderRadius: 34,
      background: '#ffffff',
      border: '6px solid #111',
      boxShadow: shadow,
    }}
  >
    <div style={{fontSize: 48, fontWeight: 950, marginBottom: 28}}>
      The part that matters
    </div>
    {[
      ['Raw value', '$80', colors.green],
      ['PSA 9 after fees', '-$15', colors.red],
      ['PSA 10 upside', '+$55', colors.orange],
    ].map(([label, value, color], index) => (
      <div
        key={label}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 180px',
          gap: 20,
          alignItems: 'center',
          padding: '28px 0',
          borderTop: index === 0 ? 'none' : '4px solid #eee',
          fontSize: 44,
          fontWeight: 930,
        }}
      >
        <span>{label}</span>
        <span
          style={{
            color,
            textAlign: 'right',
            transform: index === 1 ? 'scale(1.2)' : undefined,
          }}
        >
          {value}
        </span>
      </div>
    ))}
    <WarningLabel style={{left: 108, top: 560}}>PSA 9 can lose money</WarningLabel>
  </div>
);

const CtaPanel = ({tone}: {tone: Tone}) => (
  <AbsoluteFill
    style={{
      background: 'linear-gradient(180deg, #111 0%, #1d252c 58%, #111 100%)',
    }}
  >
    <PhoneMockup
      mode="result"
      style={{position: 'absolute', left: 280, top: 175, transform: 'scale(0.9)'}}
    />
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
        fontSize: 70,
        lineHeight: 1.02,
        fontWeight: 950,
        boxShadow: '0 20px 70px rgba(0,0,0,0.35)',
      }}
    >
      {tone === 'urgent' ? 'Use CardSnap first.' : 'Check before you grade.'}
    </div>
  </AbsoluteFill>
);

const SceneVisual = ({scene, tone}: {scene: Scene; tone: Tone}) => {
  const labels = scene.labels ?? [];

  if (scene.layout === 'talk-card') {
    return (
      <>
        <TalkingHead mood={tone} />
        <FakeSportsCard style={{position: 'absolute', right: 78, top: 440}} />
        {labels.map((label, index) => (
          <WarningLabel
            key={label}
            style={{left: index % 2 ? 650 : 72, top: 1080 + index * 120}}
            delay={index * 8}
          >
            {label}
          </WarningLabel>
        ))}
      </>
    );
  }

  if (scene.layout === 'receipt') {
    return <Receipt labels={labels} />;
  }

  if (scene.layout === 'phone-input') {
    return (
      <>
        <PhoneMockup
          mode="input"
          style={{position: 'absolute', left: 280, top: 170, transform: 'scale(0.95)'}}
        />
        <FakeSportsCard
          style={{position: 'absolute', right: 70, top: 1010, transform: 'scale(0.72) rotate(5deg)'}}
        />
      </>
    );
  }

  if (scene.layout === 'phone-analyze') {
    return (
      <>
        <PhoneMockup
          mode="analyze"
          style={{position: 'absolute', left: 280, top: 155, transform: 'scale(0.96)'}}
        />
        {labels.map((label, index) => (
          <WarningLabel
            key={label}
            tone="black"
            style={{left: index % 2 ? 610 : 82, top: 930 + index * 90}}
            delay={index * 5}
          >
            {label}
          </WarningLabel>
        ))}
      </>
    );
  }

  if (scene.layout === 'values') {
    return <ValuesPanel />;
  }

  if (scene.layout === 'phone-result') {
    return (
      <>
        <PhoneMockup
          mode="result"
          style={{position: 'absolute', left: 280, top: 145, transform: 'scale(0.98)'}}
        />
        {labels.map((label, index) => (
          <WarningLabel
            key={label}
            tone="green"
            style={{left: 130 + index * 70, top: 1160 + index * 80}}
            delay={index * 8}
          >
            {label}
          </WarningLabel>
        ))}
      </>
    );
  }

  return <CtaPanel tone={tone} />;
};

export const CardSnapUgcAd = ({tone}: {tone: Tone}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const endFade = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const spec = scripts[tone];
  const sceneDurations = scaledSceneDurations(tone);
  let cursor = 0;

  return (
    <AbsoluteFill style={{background: colors.paper, opacity: endFade}}>
      <Audio src={staticFile('audio/cardsnap-ugc-music.wav')} volume={0.08} />
      <Audio src={staticFile(spec.audio)} volume={1.15} />

      {spec.scenes.map((scene, index) => {
        const from = cursor;
        const duration = sceneDurations[index];
        cursor += duration;

        return (
          <Sequence key={`${tone}-${index}`} from={from} durationInFrames={duration}>
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

export const UGC_FPS = fps;
