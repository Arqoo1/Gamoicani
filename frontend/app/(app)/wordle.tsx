import React from "react";
import WordleScreen from "@/features/wordle/screens/WordleScreen";
import { FeatureErrorBoundary } from "@/shared/components/FeatureErrorBoundary";

export default function WordleRoute() {
  return (
    <FeatureErrorBoundary route="/(app)/wordle">
      <WordleScreen />
    </FeatureErrorBoundary>
  );
}
