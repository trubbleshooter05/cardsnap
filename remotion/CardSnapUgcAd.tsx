import type {CSSProperties} from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FakeSportsCard} from './components/FakeSportsCard';
import {PhoneMockup} from './components/PhoneMockup';
import {TikTokCaption} from './components/TikTokCaption';
import {WarningLabel} from './components/WarningLabel';
import {colors, fill, fontStack} from './styles';
import {UgcAudioBed} from './audio';

const sceneBase: CSSProperties = {
  ...fill,
  overflow: 'hidden',
  fontFamily: fontStack,
  background: colors.paper,
};

const TalkingHead = ({mood = 'stressed'}: {mood?: 'stressed' | 'sure' | 'oops'}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 8) * 8;

  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        top: 180 + bob,
        width: 860,
        height: 980,
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
          left: 240,
          top: 38,
          width: 380,
          height: 160,
          borderRadius: '160px 160px 60px 60px',
          background: '#272727',
          border: '8px solid #111',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 316,
          top: 285,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#111',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 498,
          top: 285,
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
          top: 400,
          width: 150,
          height: mood === 'sure' ? 34 : 74,
          borderRadius: mood === 'oops' ? '0 0 90px 90px' : 999,
          background: mood === 'sure' ? '#111' : 'transparent',
          borderBottom: mood === 'sure' ? 'none' : '12px solid #111',
          transform: mood === 'oops' ? 'rotate(180deg)' : 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 530,
          width: 640,
          height: 470,
          borderRadius: '90px 90px 0 0',
          background: colors.blue,
          border: '8px solid #111',
        }}
      />
    </div>
  );
};

const JumpCut = ({children, bg = colors.paper}: {children: React.ReactNode; bg?: string}) => {
  return (
    <AbsoluteFill
      style={{
        ...sceneBase,
        background: bg,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const TopBug = ({text}: {text: string}) => (
  <div
    style={{
      position: 'absolute',
      top: 70,
      left: 58,
      right: 58,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: colors.ink,
      fontSize: 28,
      fontWeight: 950,
      textTransform: 'uppercase',
    }}
  >
    <span>{text}</span>
    <span style={{color: colors.red}}>REC</span>
  </div>
);

const MoneyReceipt = () => (
  <div
    style={{
      position: 'absolute',
      left: 135,
      top: 270,
      width: 810,
      padding: 48,
      background: '#ffffff',
      border: '6px solid #111',
      boxShadow: '14px 16px 0 rgba(0,0,0,0.2)',
      transform: 'rotate(-2deg)',
    }}
  >
    {[
      ['grading fee', '$25'],
      ['shipping', 'more'],
      ['waiting', 'forever'],
      ['bad grade', 'pain'],
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
        <span>{value}</span>
      </div>
    ))}
  </div>
);

export const CardSnapUgcAd = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const endFade = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  return (
    <AbsoluteFill style={{background: colors.paper, opacity: endFade}}>
      <UgcAudioBed />

      <Sequence durationInFrames={60}>
        <JumpCut bg="#f8efe4">
          <TopBug text="raw card check" />
          <TalkingHead mood="stressed" />
          <FakeSportsCard style={{position: 'absolute', right: 78, top: 410}} />
          <WarningLabel style={{left: 58, top: 1180}}>$25 mistake?</WarningLabel>
          <TikTokCaption
            text="Bro I was literally about to waste $25 grading this..."
            emphasis="$25"
          />
        </JumpCut>
      </Sequence>

      <Sequence from={60} durationInFrames={54}>
        <JumpCut bg="#eaf3ff">
          <TopBug text="looked clean" />
          <FakeSportsCard
            style={{position: 'absolute', left: 330, top: 250, transform: 'scale(1.28)'}}
          />
          <WarningLabel tone="green" style={{left: 116, top: 1050}}>
            looked clean
          </WarningLabel>
          <WarningLabel tone="yellow" style={{right: 100, top: 1180}} delay={8}>
            10 candidate?
          </WarningLabel>
          <TikTokCaption
            text="I thought this was a 10. Like no question."
            emphasis="10"
          />
        </JumpCut>
      </Sequence>

      <Sequence from={114} durationInFrames={54}>
        <JumpCut bg="#10151d">
          <TopBug text="then i typed it in" />
          <PhoneMockup mode="input" style={{position: 'absolute', left: 280, top: 190}} />
          <TikTokCaption text="Then I ran the numbers... and yeah, I was wrong." emphasis="wrong" />
        </JumpCut>
      </Sequence>

      <Sequence from={168} durationInFrames={60}>
        <JumpCut bg="#f4f7fb">
          <TopBug text="comps + fees" />
          <PhoneMockup mode="analyze" style={{position: 'absolute', left: 280, top: 170}} />
          <WarningLabel tone="black" style={{left: 96, bottom: 430}}>
            raw comps
          </WarningLabel>
          <WarningLabel tone="black" style={{right: 95, bottom: 330}} delay={10}>
            psa values
          </WarningLabel>
          <WarningLabel tone="black" style={{left: 138, bottom: 225}} delay={18}>
            fees
          </WarningLabel>
          <TikTokCaption text="CardSnap checks raw value, PSA upside, and fees..." />
        </JumpCut>
      </Sequence>

      <Sequence from={228} durationInFrames={54}>
        <JumpCut bg="#fff7dc">
          <TopBug text="the hidden cost" />
          <FakeSportsCard
            issueMode
            style={{position: 'absolute', left: 330, top: 220, transform: 'scale(1.3)'}}
          />
          <WarningLabel style={{right: 88, top: 970}}>boom</WarningLabel>
          <WarningLabel style={{left: 76, top: 1120}} delay={8}>
            fees matter
          </WarningLabel>
          <TikTokCaption text="The fee killed the upside. Boom. Bad idea." />
        </JumpCut>
      </Sequence>

      <Sequence from={282} durationInFrames={54}>
        <JumpCut bg="#eaf3ff">
          <TopBug text="result screen" />
          <PhoneMockup mode="result" style={{position: 'absolute', left: 280, top: 140}} />
          <WarningLabel tone="yellow" style={{left: 80, top: 1130}}>
            not enough upside
          </WarningLabel>
          <TikTokCaption text="Even a good grade barely clears the cost." emphasis="cost" />
        </JumpCut>
      </Sequence>

      <Sequence from={336} durationInFrames={60}>
        <JumpCut bg="#ffe9e6">
          <TopBug text="the reveal" />
          <FakeSportsCard
            issueMode
            style={{position: 'absolute', left: 100, top: 250, transform: 'scale(1.05)'}}
          />
          <PhoneMockup mode="result" style={{position: 'absolute', right: 70, top: 260, transform: 'scale(0.82)'}} />
          <WarningLabel style={{left: 175, top: 1050}}>skip grading</WarningLabel>
          <TikTokCaption text="This is NOT worth grading." emphasis="NOT" />
        </JumpCut>
      </Sequence>

      <Sequence from={396} durationInFrames={66}>
        <JumpCut bg="#fffaf1">
          <TopBug text="money lost" />
          <MoneyReceipt />
          <WarningLabel style={{left: 190, top: 1040}}>paid to get humbled</WarningLabel>
          <TikTokCaption
            text="I would've paid to get humbled."
            emphasis="paid"
            style={{bottom: 170}}
          />
        </JumpCut>
      </Sequence>

      <Sequence from={462} durationInFrames={72}>
        <JumpCut bg="#eafff0">
          <TopBug text="save the fee" />
          <PhoneMockup mode="result" style={{position: 'absolute', left: 84, top: 220, transform: 'scale(0.86)'}} />
          <div
            style={{
              position: 'absolute',
              right: 88,
              top: 430,
              width: 380,
              height: 500,
              border: '6px solid #111',
              borderRadius: 32,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 54,
              fontWeight: 950,
              textAlign: 'center',
              transform: 'rotate(3deg)',
              boxShadow: '12px 14px 0 rgba(0,0,0,0.18)',
            }}
          >
            KEEP
            <br />
            RAW
          </div>
          <WarningLabel tone="green" style={{right: 90, top: 1040}}>
            $25 saved
          </WarningLabel>
          <TikTokCaption text="If you're grading cards... stop guessing." emphasis="stop" />
        </JumpCut>
      </Sequence>

      <Sequence from={534} durationInFrames={54}>
        <JumpCut bg="#111111">
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, #111 0%, #1d252c 58%, #111 100%)',
            }}
          />
          <PhoneMockup mode="input" style={{position: 'absolute', left: 88, top: 330, transform: 'scale(0.82) rotate(-2deg)'}} />
          <FakeSportsCard style={{position: 'absolute', right: 88, top: 420, transform: 'scale(0.9) rotate(4deg)'}} />
          <WarningLabel tone="yellow" style={{left: 150, top: 1120}}>
            stop guessing
          </WarningLabel>
          <TikTokCaption
            text="Stop guessing."
            emphasis="Stop"
            style={{bottom: 175, fontSize: 84}}
          />
        </JumpCut>
      </Sequence>

      <Sequence from={588} durationInFrames={60}>
        <JumpCut bg="#f8efe4">
          <TopBug text="last check" />
          <TalkingHead mood="oops" />
          <PhoneMockup mode="result" style={{position: 'absolute', right: 70, top: 290, transform: 'scale(0.75) rotate(3deg)'}} />
          <WarningLabel style={{left: 80, top: 1080}}>before you submit</WarningLabel>
          <TikTokCaption
            text="If you're grading cards..."
            emphasis="grading"
            style={{bottom: 170, fontSize: 76}}
          />
        </JumpCut>
      </Sequence>

      <Sequence from={648} durationInFrames={342}>
        <JumpCut bg="#111111">
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, #111 0%, #1d252c 58%, #111 100%)',
            }}
          />
          <PhoneMockup mode="input" style={{position: 'absolute', left: 280, top: 210, transform: 'scale(0.95)'}} />
          <div
            style={{
              position: 'absolute',
              left: 70,
              right: 70,
              top: 1260,
              padding: 38,
              borderRadius: 28,
              background: '#fff',
              border: '6px solid #111',
              textAlign: 'center',
              color: colors.ink,
              fontSize: 76,
              lineHeight: 1,
              fontWeight: 950,
              boxShadow: '0 20px 70px rgba(0,0,0,0.35)',
            }}
          >
            Run the math first.
          </div>
          <TikTokCaption
            text="Run the math first."
            emphasis="first"
            style={{bottom: 175, fontSize: 84}}
          />
        </JumpCut>
      </Sequence>
    </AbsoluteFill>
  );
};
