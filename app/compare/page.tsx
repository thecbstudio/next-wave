import { Suspense } from "react"
import { CompareView } from "@/components/compare/CompareView"

export const metadata = {
  title: "Compare Products — TrendPulse",
  description: "Compare two food or FMCG products head-to-head across trend metrics.",
}

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareView />
    </Suspense>
  )
}
