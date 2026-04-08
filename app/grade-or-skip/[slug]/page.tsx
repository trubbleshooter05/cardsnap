import { nicheContentMap } from "@/lib/niche-content";

export default function Page({ params }: { params: { slug: string } }) {
  const data = nicheContentMap[params.slug];

  if (!data) {
    return <div>Not found</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>{data.h1 || data.sport || params.slug}</h1>
      <p>{data.seoDescription}</p>
    </div>
  );
}
