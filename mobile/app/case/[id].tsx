import { router, useLocalSearchParams } from "expo-router";

import CaseDetailsContent from "../../components/CaseDetailsContent";

function parseCaseParam(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export default function CaseDetailsRoute() {
  const params = useLocalSearchParams();
  const caseItem = parseCaseParam(params.caseItem);

  return (
    <CaseDetailsContent
      caseId={String(params.id || "")}
      caseItem={caseItem}
      onTabNavigate={(path: string) => router.replace(path as never)}
    />
  );
}
