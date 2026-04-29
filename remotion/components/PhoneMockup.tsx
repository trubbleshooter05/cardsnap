import type {CSSProperties} from 'react';
import {useCurrentFrame} from 'remotion';
import {colors, fontStack, shadow} from '../styles';

type PhoneMockupProps = {
  mode: 'input' | 'analyze' | 'result';
  style?: CSSProperties;
};

export const PhoneMockup = ({mode, style}: PhoneMockupProps) => {
  const frame = useCurrentFrame();
  const progress = Math.min(1, Math.max(0, (frame % 90) / 75));

  return (
    <div
      style={{
        width: 520,
        height: 980,
        borderRadius: 70,
        background: '#0d1016',
        border: '9px solid #111',
        padding: 22,
        boxShadow: shadow,
        fontFamily: fontStack,
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 28,
          left: 190,
          width: 140,
          height: 32,
          borderRadius: 999,
          background: '#050505',
          zIndex: 4,
        }}
      />
      <div
        style={{
          height: '100%',
          borderRadius: 48,
          background: '#f7fafc',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: 112,
            background: colors.ink,
            color: '#fff',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 34px 22px',
            fontSize: 36,
            fontWeight: 950,
          }}
        >
          CardSnap
        </div>
        <div
          style={{
            padding: 34,
            color: colors.ink,
          }}
        >
          {mode === 'input' ? (
            <>
              <div style={{fontSize: 38, fontWeight: 950}}>Analyze card</div>
              <div style={{marginTop: 16, color: colors.muted, fontSize: 25}}>
                Enter the card name and condition.
              </div>
              <div
                style={{
                  marginTop: 38,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 28,
                }}
              >
                <div
                  style={{
                    border: '3px solid #111',
                    borderRadius: 22,
                    background: '#fff',
                    padding: 22,
                  }}
                >
                  <div style={{fontSize: 20, fontWeight: 900, color: colors.muted}}>
                    CARD
                  </div>
                  <div style={{marginTop: 12, fontSize: 32, fontWeight: 950, lineHeight: 1.12}}>
                    2020-21 Panini Prizm LaMelo Ball RC
                  </div>
                </div>
                <div
                  style={{
                    border: '3px solid #111',
                    borderRadius: 22,
                    background: '#fff',
                    padding: 22,
                  }}
                >
                  <div style={{fontSize: 20, fontWeight: 900, color: colors.muted}}>
                    CONDITION
                  </div>
                  <div style={{marginTop: 12, fontSize: 34, fontWeight: 950}}>Raw</div>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    borderRadius: 22,
                    background: colors.yellow,
                    border: '4px solid #111',
                    padding: '24px 28px',
                    textAlign: 'center',
                    fontSize: 34,
                    fontWeight: 950,
                    boxShadow: '8px 10px 0 rgba(0,0,0,0.2)',
                  }}
                >
                  Analyze Card
                </div>
              </div>
            </>
          ) : null}
          {mode === 'analyze' ? (
            <>
              <div style={{fontSize: 38, fontWeight: 950}}>Running comps</div>
              <div
                style={{
                  marginTop: 34,
                  height: 24,
                  borderRadius: 999,
                  background: '#dde3eb',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress * 100}%`,
                    background: colors.blue,
                  }}
                />
              </div>
              {['Raw comps', 'PSA 9 value', 'PSA 10 upside', 'Fees + shipping'].map((label, index) => (
                <div
                  key={label}
                  style={{
                    marginTop: 44,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 34,
                    fontWeight: 850,
                    opacity: progress > index * 0.2 ? 1 : 0.28,
                  }}
                >
                  <span>{label}</span>
                  <span>{progress > index * 0.2 ? 'checking' : 'queued'}</span>
                </div>
              ))}
            </>
          ) : null}
          {mode === 'result' ? (
            <>
              <div style={{fontSize: 38, fontWeight: 950}}>Grade-or-skip</div>
              <div
                style={{
                  marginTop: 28,
                  padding: 24,
                  borderRadius: 24,
                  background: '#fff3f2',
                  border: `4px solid ${colors.red}`,
                }}
              >
                <div style={{fontSize: 28, fontWeight: 950, color: colors.red}}>
                  Fees wipe out upside
                </div>
                <div style={{fontSize: 72, fontWeight: 950, marginTop: 6}}>
                  Skip
                </div>
              </div>
              {[
                ['Raw value $80', colors.green],
                ['PSA 9 net -$15', colors.red],
                ['PSA 10 only +$55', colors.orange],
              ].map(([label, color]) => (
                <div
                  key={label}
                  style={{
                    marginTop: 28,
                    padding: '22px 24px',
                    borderRadius: 18,
                    background: '#fff',
                    border: '3px solid #111',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 32,
                    fontWeight: 900,
                  }}
                >
                  <span>{label}</span>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: color,
                      border: '3px solid #111',
                    }}
                  />
                </div>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
