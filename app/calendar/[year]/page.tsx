import { YearView } from "@/components/YearView";

export const dynamic = "force-dynamic";

export default async function CalendarYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: y } = await params;
  const year = Number.parseInt(y, 10);
  if (!Number.isFinite(year) || year < 1900 || year > 9999) {
    return <div className="p-8 text-sm text-red-600">Invalid year in URL.</div>;
  }
  return <YearView year={year} />;
}
