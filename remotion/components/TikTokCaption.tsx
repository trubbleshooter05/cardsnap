import type {CSSProperties} from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fontStack} from '../styles';

type TikTokCaptionProps = {
  text: string;
  emphasis?: string;
  style?: CSSProperties;
};

export const TikTokCaption = ({text, emphasis, style}: TikTokCaptionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    config: {damping: 14, stiffness: 150, mass: 0.7},
  });
  const y = interpolate(entrance, [0, 1], [48, 0]);
  const displayText =
    emphasis && text.includes(emphasis)
      ? text.split(emphasis).map((part, index, parts) => (
          <span key={`${part}-${index}`}>
            {part}
            {index < parts.length - 1 ? (
              <span style={{color: colors.yellow}}>{emphasis}</span>
            ) : null}
          </span>
        ))
      : text;

  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        bottom: 150,
        zIndex: 30,
        transform: `translateY(${y}px)`,
        opacity: entrance,
        fontFamily: fontStack,
        fontSize: 68,
        lineHeight: 1.03,
        fontWeight: 950,
        letterSpacing: 0,
        textAlign: 'center',
        color: '#ffffff',
        textShadow:
          '0 6px 0 #111, 5px 0 0 #111, -5px 0 0 #111, 0 -5px 0 #111',
        ...style,
      }}
    >
      {displayText}
    </div>
  );
};
