"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import StudioShell from "@/components/studio/StudioShell";
import TitleSetup from "@/components/studio/TitleSetup";

export default function EditTitlePage() {
  const params = useParams();
  const id = String(params?.id || "");
  return (
    <StudioShell>
      <Suspense fallback={null}>
        <TitleSetup key={id} submissionId={id} />
      </Suspense>
    </StudioShell>
  );
}
