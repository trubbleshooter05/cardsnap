import type {CSSProperties} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {colors, shadow} from '../styles';

type FakeSportsCardProps = {
  style?: CSSProperties;
  issueMode?: boolean;
};

export const FakeSportsCard = ({style, issueMode = false}: FakeSportsCardProps) => {
  const frame = useCurrentFrame();
  const tilt = Math.sin(frame / 14) * 1.4;
  const glare = interpolate(frame % 90, [0, 45, 90], [-90, 130, 310]);

  return (
    <div
      style={{
        width: 420,
        height: 590,
        borderRadius: 30,
        padding: 20,
        background: '#fff',
        border: '8px solid #151515',
        boxShadow: shadow,
        transform: `rotate(${tilt}deg)`,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 20,
          borderRadius: 18,
          background:
            'linear-gradient(145deg, #e9f4ff 0%, #ffffff 42%, #e8ffe9 100%)',
          border: '3px solid #111',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 58,
          right: 58,
          top: 62,
          height: 300,
          borderRadius: 24,
          background: 'linear-gradient(160deg, #1f6bff, #31d179)',
          border: '4px solid #111',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 170,
            height: 230,
            left: 95,
            top: 64,
            borderRadius: '48% 48% 18% 18%',
            background: '#fff6d4',
            border: '4px solid #111',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 106,
            height: 106,
            left: 128,
            top: 22,
            borderRadius: '50%',
            background: '#f7c58c',
            border: '4px solid #111',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 70,
            right: 70,
            bottom: 28,
            height: 42,
            borderRadius: 999,
            background: '#111',
            opacity: 0.18,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 52,
          right: 52,
          bottom: 104,
          height: 76,
          borderRadius: 12,
          border: '4px solid #111',
          background: colors.yellow,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 72,
          bottom: 122,
          fontSize: 30,
          fontWeight: 950,
          color: colors.ink,
        }}
      >
        GENERIC ROOKIE
      </div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          bottom: 56,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 24,
          fontWeight: 900,
          color: colors.muted,
        }}
      >
        <span>NO. 42</span>
        <span>2026</span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: -80,
          left: `${glare}%`,
          width: 90,
          height: 760,
          background: 'rgba(255,255,255,0.36)',
          transform: 'rotate(22deg)',
          filter: 'blur(10px)',
        }}
      />
      {issueMode ? (
        <>
          <div
            style={{
              position: 'absolute',
              right: 18,
              top: 18,
              width: 82,
              height: 82,
              borderTop: `14px solid ${colors.red}`,
              borderRight: `14px solid ${colors.red}`,
              borderRadius: 18,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 20,
              borderLeft: `11px solid ${colors.green}`,
              borderRight: `27px solid ${colors.red}`,
              borderTop: '0 solid transparent',
              borderBottom: '0 solid transparent',
              opacity: 0.72,
            }}
          />
        </>
      ) : null}
    </div>
  );
};
