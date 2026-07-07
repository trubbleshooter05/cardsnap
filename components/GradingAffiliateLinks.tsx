const PSA_URL = "https://www.psacard.com";
const BGS_URL = "https://www.beckett.com/grading";

type Props = {
  className?: string;
};

export function GradingAffiliateLinks({ className = "" }: Props) {
  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Ready to grade?
      </p>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={PSA_URL}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="flex h-11 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          Submit to PSA
        </a>
        <a
          href={BGS_URL}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="flex h-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20"
        >
          Submit to Beckett
        </a>
      </div>
    </div>
  );
}
