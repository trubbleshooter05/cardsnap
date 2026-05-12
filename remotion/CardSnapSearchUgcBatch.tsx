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

export const SEARCH_UGC_FPS = 30;

type SearchUgcTone = 'almost_overpaid' | 'psa9_destroyer' | 'mistake_avoided';

type Scene = {
  duration: number;
  caption: string;
  emphasis?: string;
  bug: string;
  bg: string;
  layout: 'talk' | 'phone-input' | 'phone-analyze' | 'values' | 'receipt' | 'cta';
  labels?: string[];
};

const scripts: Record<SearchUgcTone, {targetFrames: number; scenes: Scene[]}> = {
  almost_overpaid: {
    targetFrames: 420,
    scenes: [
      {duration: 40, caption: 'Nobody told me PSA 9 destroys profit.', emphasis: 'destroys', bug: 'hard lesson', bg: '#ff3b30', layout: 'talk', labels: ['ouch']},
      {duration: 55, caption: 'Been grading for years. Thought I had it figured.', emphasis: 'years', bug: 'too confident', bg: '#fff4de', layout: 'talk'},
      {duration: 55, caption: 'CardSnap ran the numbers.', emphasis: 'CardSnap', bug: 'run the math', bg: '#10151d', layout: 'phone-input'},
      {duration: 90, caption: 'Submitting cards that barely beat raw at a 9.', emphasis: 'barely', bug: 'psa 9 trap', bg: '#f4f7fb', layout: 'values'},
      {duration: 70, caption: "That's how you bleed money.", emphasis: 'bleed', bug: 'fee mistake', bg: '#ffe9e6', layout: 'receipt'},
      {duration: 90, caption: 'Changed everything. Check CardSnap first.', emphasis: 'CardSnap', bug: 'use cardsnap', bg: '#111111', layout: 'cta'},
    ],
  },
  psa9_destroyer: {
    targetFrames: 420,
    scenes: [
      {duration: 40, caption: "That's how grading fees disappear.", emphasis: 'disappear', bug: 'fee trap', bg: '#ff3b30', layout: 'talk', labels: ['fee gone']},
      {duration: 70, caption: 'You submit five cards. Bet on a 9.', emphasis: 'five', bug: 'bad math', bg: '#fff4de', layout: 'receipt'},
      {duration: 80, caption: 'Fees eat the margin. Suddenly neutral.', emphasis: 'Fees', bug: 'psa 9 reality', bg: '#10151d', layout: 'values'},
      {duration: 90, caption: 'CardSnap forces you to test the 9 scenario first.', emphasis: '9 scenario', bug: 'check first', bg: '#f4f7fb', layout: 'phone-analyze', labels: ['PSA 9', 'fees', 'net']},
      {duration: 70, caption: 'Before you pay the fee.', emphasis: 'Before', bug: 'stop losing', bg: '#ffe9e6', layout: 'receipt'},
      {duration: 80, caption: 'Run the PSA 9 math. Every time.', emphasis: 'Every time', bug: 'use cardsnap', bg: '#111111', layout: 'cta'},
    ],
  },
  mistake_avoided: {
    targetFrames: 420,
    scenes: [
      {duration: 45, caption: 'Collectors keep making this mistake.', emphasis: 'mistake', bug: 'stop this', bg: '#ff6b00', layout: 'talk', labels: ['common error']},
      {duration: 75, caption: 'See one PSA 10 comp. Anchor on it. Overpay.', emphasis: 'Overpay', bug: 'anchoring trap', bg: '#fff4de', layout: 'phone-input'},
      {duration: 90, caption: 'CardSnap shows raw, 9, and 10. Three numbers.', emphasis: 'Three numbers', bug: 'see all three', bg: '#f4f7fb', layout: 'values', labels: ['raw', 'PSA 9', 'PSA 10']},
      {duration: 60, caption: "Suddenly the buy looks stupid.", emphasis: 'stupid', bug: 'the reveal', bg: '#ffe9e6', layout: 'receipt'},
      {duration: 80, caption: 'Run CardSnap before you buy. Seriously.', emphasis: 'before', bug: 'use cardsnap', bg: '#111111', layout: 'cta'},
    ],
  },
};

function scaledDurations(tone: SearchUgcTone): number[] {
  const spec = scripts[tone];
  const base = spec.scenes.reduce((sum, s) => sum + s.duration, 0);
  let used = 0;
  return spec.scenes.map((s, i) => {
    if (i === spec.scenes.length - 1) return spec.targetFrames - used;
    const d = Math.max(1, Math.round((s.duration / base) * spec.targetFrames));
    used += d;
    return d;
  });
}

export const CARD_SNAP_SEARCH_UGC_DURATIONS = {
  almost_overpaid: scripts.almost_overpaid.targetFrames,
  psa9_destroyer: scripts.psa9_destroyer.targetFrames,
  mistake_avoided: scripts.mistake_avoided.targetFrames,
} as const;

const sceneBase: CSSProperties = {
  ...fill,
  overflow: 'hidden',
  fontFamily: fontStack,
};

const accentColor: Record<SearchUgcTone, string> = {
  almost_overpaid: colors.red,
  psa9_destroyer: colors.orange,
  mistake_avoided: colors.blue,
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

const Creator = ({tone}: {tone: SearchUgcTone}) => {
  const frame = useCurrentFrame();
  const wobble = Math.sin(frame / 9) * 5;
  const shirt = accentColor[tone];

  return (
    <div style={{position: 'absolute', left: 98, top: 210 + wobble, width: 880, height: 900}}>
      <div style={{position: 'absolute', left: 200, top: 72, width: 472, height: 472, borderRadius: '50%', background: '#f6c692', border: '8px solid #111', boxShadow: '16px 18px 0 rgba(0,0,0,0.18)'}} />
      <div style={{position: 'absolute', left: 242, top: 38, width: 390, height: 152, borderRadius: '150px 150px 60px 60px', background: '#272727', border: '8px solid #111'}} />
      <div style={{position: 'absolute', left: 320, top: 286, width: 48, height: 48, borderRadius: '50%', background: '#111'}} />
      <div style={{position: 'absolute', left: 504, top: 286, width: 48, height: 48, borderRadius: '50%', background: '#111'}} />
      <div style={{position: 'absolute', left: 362, top: 408, width: 150, height: 60, borderRadius: '0 0 90px 90px', border: '12px solid #111', borderTop: 'none'}} />
      <div style={{position: 'absolute', left: 118, top: 528, width: 640, height: 440, borderRadius: '90px 90px 0 0', background: shirt, border: '8px solid #111'}} />
    </div>
  );
};

const valuesData: Record<SearchUgcTone, Array<[string, string, string]>> = {
  almost_overpaid: [
    ['Raw today', '$80', colors.orange],
    ['PSA 9 after fees', '-$5', colors.red],
    ['PSA 10 upside', '+$110', colors.green],
  ],
  psa9_destroyer: [
    ['Raw today', '$60', colors.orange],
    ['PSA 9 after fees', '-$20', colors.red],
    ['PSA 10 upside', '+$65', colors.green],
  ],
  mistake_avoided: [
    ['Raw today', '$120', colors.orange],
    ['PSA 9 after fees', '+$10', colors.orange],
    ['PSA 10 upside', '+$180', colors.green],
  ],
};

const ValuesPanel = ({tone}: {tone: SearchUgcTone}) => (
  <div style={{position: 'absolute', left: 90, right: 90, top: 285, padding: 42, borderRadius: 34, background: '#fff', border: '6px solid #111', boxShadow: shadow}}>
    <div style={{fontSize: 48, fontWeight: 950, marginBottom: 28}}>The part people skip</div>
    {valuesData[tone].map(([label, value, color], index) => (
      <div
        key={label}
        style={{display: 'grid', gridTemplateColumns: '1fr 200px', gap: 20, alignItems: 'center', padding: '28px 0', borderTop: index === 0 ? 'none' : '4px solid #eee', fontSize: 44, fontWeight: 930}}
      >
        <span>{label}</span>
        <span style={{color, textAlign: 'right'}}>{value}</span>
      </div>
    ))}
    <WarningLabel style={{left: 90, top: 570}}>PSA 9 can lose money</WarningLabel>
  </div>
);

const Receipt = ({tone}: {tone: SearchUgcTone}) => {
  const rows: Array<[string, string]> =
    tone === 'psa9_destroyer'
      ? [['grading fee', '$25'], ['shipping', '$15'], ['PSA 9 net', '-$20'], ['result', 'loss']]
      : [['grading fee', '$25'], ['shipping', '$15'], ['PSA 9 spread', '$10'], ['net result', '-$30']];

  return (
    <div style={{position: 'absolute', left: 135, top: 290, width: 810, padding: 48, background: '#fff', border: '6px solid #111', boxShadow: '14px 16px 0 rgba(0,0,0,0.2)', transform: 'rotate(-2deg)'}}>
      {rows.map(([label, value]) => (
        <div key={label} style={{display: 'flex', justifyContent: 'space-between', borderBottom: '4px dashed #ddd', padding: '24px 0', fontSize: 46, fontWeight: 900}}>
          <span>{label}</span>
          <span style={{color: value.startsWith('-') || value === 'loss' ? colors.red : colors.ink}}>{value}</span>
        </div>
      ))}
      <WarningLabel style={{left: 85, top: 650}}>fee ate the upside</WarningLabel>
    </div>
  );
};

const CtaPanel = ({tone}: {tone: SearchUgcTone}) => {
  const ctaText: Record<SearchUgcTone, string> = {
    almost_overpaid: 'Check PSA 9 before you grade.',
    psa9_destroyer: 'Run the math. Every time.',
    mistake_avoided: 'See all three tiers. Not one.',
  };

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #111 0%, #1d252c 58%, #111 100%)'}}>
      <PhoneMockup mode="result" style={{position: 'absolute', left: 280, top: 175, transform: 'scale(0.9)'}} />
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
        {ctaText[tone]}
      </div>
    </AbsoluteFill>
  );
};

const SceneVisual = ({scene, tone}: {scene: Scene; tone: SearchUgcTone}) => {
  const labels = scene.labels ?? [];

  if (scene.layout === 'talk') {
    return (
      <>
        <Creator tone={tone} />
        <FakeSportsCard style={{position: 'absolute', right: 78, top: 440}} />
        {labels.map((label, i) => (
          <WarningLabel key={label} style={{left: i % 2 ? 650 : 72, top: 1080 + i * 120}} delay={i * 8}>{label}</WarningLabel>
        ))}
      </>
    );
  }

  if (scene.layout === 'phone-input') {
    return (
      <>
        <PhoneMockup mode="input" style={{position: 'absolute', left: 280, top: 170, transform: 'scale(0.95)'}} />
        <FakeSportsCard style={{position: 'absolute', right: 70, top: 1010, transform: 'scale(0.72) rotate(5deg)'}} />
      </>
    );
  }

  if (scene.layout === 'phone-analyze') {
    return (
      <>
        <PhoneMockup mode="analyze" style={{position: 'absolute', left: 280, top: 155, transform: 'scale(0.96)'}} />
        {labels.map((label, i) => (
          <WarningLabel key={label} tone="black" style={{left: i % 2 ? 610 : 82, top: 930 + i * 90}} delay={i * 5}>{label}</WarningLabel>
        ))}
      </>
    );
  }

  if (scene.layout === 'values') {
    return (
      <>
        <ValuesPanel tone={tone} />
        {labels.map((label, i) => (
          <WarningLabel key={label} tone="black" style={{left: i % 2 ? 620 : 82, top: 960 + i * 90}} delay={i * 6}>{label}</WarningLabel>
        ))}
      </>
    );
  }

  if (scene.layout === 'receipt') {
    return <Receipt tone={tone} />;
  }

  return <CtaPanel tone={tone} />;
};

export const CardSnapSearchUgcBatch = ({tone, audioSrc}: {tone: SearchUgcTone; audioSrc?: string}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const endFade = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const durations = scaledDurations(tone);
  let cursor = 0;

  return (
    <AbsoluteFill style={{background: colors.paper, opacity: endFade}}>
      {audioSrc && <Audio src={staticFile(audioSrc)} volume={1} />}
      {scripts[tone].scenes.map((scene, index) => {
        const from = cursor;
        const duration = durations[index]!;
        cursor += duration;
        return (
          <Sequence key={`${tone}-${index}`} from={from} durationInFrames={duration}>
            <JumpCut bg={scene.bg}>
              <TopBug text={scene.bug} />
              <SceneVisual scene={scene} tone={tone} />
              <TikTokCaption
                text={scene.caption}
                emphasis={scene.emphasis}
                style={{bottom: scene.layout === 'cta' ? 158 : 150, fontSize: scene.caption.length > 58 ? 58 : 68}}
              />
            </JumpCut>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
