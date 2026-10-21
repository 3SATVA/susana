import data from "@/data/flow.json";
import FlowChart from "@/components/FlowChart";
import type { Flow } from "@/lib/types";

export default function Page() {
  return <FlowChart flow={data as unknown as Flow} />;
}
