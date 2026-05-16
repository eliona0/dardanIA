import { router, useLocalSearchParams } from "expo-router";

import CaseDetailsContent from "../../components/CaseDetailsContent";

export default function CaseDetailsRoute() {
  const params = useLocalSearchParams();

  return (
    <CaseDetailsContent
      caseId={String(params.id || "")}
      onTabNavigate={(path: string) => router.push(path as never)}
    />
  );
}
