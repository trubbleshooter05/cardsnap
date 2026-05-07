import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {colors, fill, fontStack} from './styles';

export const SEARCH_UGC_FPS = 30;

/** Frame counts for search-style UGC batch compositions (can tune per render). */
export const CARD_SNAP_SEARCH_UGC_DURATIONS = {
  printLines: 30 * 34,
  gradeEstimate: 30 * 34,
  hockey: 30 * 34,
} as const;

type SearchUgcTone = 'printLines' | 'gradeEstimate' | 'hockey';

const copy: Record<SearchUgcTone, {headline: string; sub: string}> = {
  printLines: {
    headline: 'Search “should I grade my card” — get the math.',
    sub: 'Raw, PSA 9, PSA 10, fees, and a clear grade-or-skip verdict.',
  },
  gradeEstimate: {
    headline: 'Stop guessing the grading upside.',
    sub: 'Model ROI before you pay PSA — CardSnap.',
  },
  hockey: {
    headline: 'Collectors: run the numbers first.',
    sub: 'CardSnap — grade-or-skip clarity in seconds.',
  },
};

export const CardSnapSearchUgcBatch = ({tone}: {tone: SearchUgcTone}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const {headline, sub} = copy[tone];

  return (
    <AbsoluteFill
      style={{
        ...fill,
        background: `linear-gradient(160deg, ${colors.dark} 0%, #0c0e12 50%, ${colors.dark} 100%)`,
        fontFamily: fontStack,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      <div style={{opacity, textAlign: 'center', maxWidth: 920}}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: '#fafafa',
            lineHeight: 1.15,
            marginBottom: 28,
          }}
        >
          {headline}
        </div>
        <div style={{fontSize: 34, fontWeight: 650, color: colors.yellow}}>CardSnap</div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: '#a3a3a3',
            marginTop: 22,
            lineHeight: 1.4,
          }}
        >
          {sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};
