import CaseDetailsContent from "../../components/CaseDetailsContent";

const routeToScreen = {
  "/": "Home",
  "/accessibility": "Accessibility",
  "/dashboard": "Dashboard",
  "/report": "Report",
};

export default function CaseDetailsScreen({ navigation, route }) {
  return (
    <CaseDetailsContent
      caseId={route?.params?.id}
      caseItem={route?.params?.caseItem}
      onTabNavigate={(path) => {
        navigation.reset({ index: 0, routes: [{ name: routeToScreen[path] || "Home" }] });
      }}
    />
  );
}
