"use client";

import { Suspense } from "react";
import StudioShell from "@/components/studio/StudioShell";
import TitleSetup from "@/components/studio/TitleSetup";

export default function NewTitlePage() {
  return (
    <StudioShell>
      <Suspense fallback={null}>
        <TitleSetup />
      </Suspense>
    </StudioShell>
  );
}
