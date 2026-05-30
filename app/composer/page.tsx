"use client";

import { ComposerLayout } from "@/components/composer/ComposerLayout";
import { useWireActions } from "@/hooks/useWireActions";
import "../composer.css";

export default function ComposerPage() {
  useWireActions();
  return <ComposerLayout />;
}
