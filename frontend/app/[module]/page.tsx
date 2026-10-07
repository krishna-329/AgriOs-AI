import { notFound } from "next/navigation";
import Planner from "@/components/pages/planner";
import Monitor from "@/components/pages/monitor";
import Grain from "@/components/pages/grain";
import Risks from "@/components/pages/risks";
import Expert from "@/components/pages/expert";
const pages = {
  "crop-planner": Planner,
  "field-monitor": Monitor,
  grainguard: Grain,
  "risk-center": Risks,
  expert: Expert,
};
export function generateStaticParams() {
  return Object.keys(pages).map((module) => ({ module }));
}
export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (!(module in pages)) notFound();
  const Page = pages[module as keyof typeof pages];
  return <Page />;
}
