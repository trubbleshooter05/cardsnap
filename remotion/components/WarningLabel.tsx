import type {CSSProperties} from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fontStack} from '../styles';

type WarningLabelProps = {
  children: string;
  tone?: 'red' | 'yellow' | 'green' | 'black';
  style?: CSSProperties;
  delay?: number;
};

export const WarningLabel = ({
  children,
  tone = 'red',
  style,
  delay = 0,
}: WarningLabelProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 11,
      mass: 0.7,
      stiffness: 170,
    },
  });
  const rotate = interpolate(pop, [0, 1], [-5, -1]);

  const palette = {
    red: {background: colors.red, color: '#ffffff'},
    yellow: {background: colors.yellow, color: colors.ink},
    green: {background: colors.green, color: colors.ink},
    black: {background: colors.ink, color: '#ffffff'},
  }[tone];

  return (
    <div
      style={{
        position: 'absolute',
        padding: '18px 26px',
        borderRadius: 16,
        border: '5px solid #111',
        boxShadow: '8px 10px 0 rgba(0,0,0,0.28)',
        fontFamily: fontStack,
        fontSize: 45,
        fontWeight: 950,
        letterSpacing: 0,
        textTransform: 'uppercase',
        transform: `scale(${pop}) rotate(${rotate}deg)`,
        opacity: pop,
        ...palette,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
