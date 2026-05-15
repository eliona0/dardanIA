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
      onTabNavigate={(path) => {
        navigation.navigate(routeToScreen[path] || "Home");
      }}
    />
  );
}
