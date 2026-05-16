import { HomeLanding } from "../../app/index";

export default function HomeScreen({ navigation }) {
  const tabRoutes = {
    "/": "Home",
    "/accessibility": "Accessibility",
    "/dashboard": "Dashboard",
    "/report": "Report",
  };

  return (
    <HomeLanding
      onCaseNavigate={(caseId) => {
        navigation.navigate("Case", { id: caseId });
      }}
      onNavigate={(action) => {
        navigation.reset({ index: 0, routes: [{ name: action.screen }] });
      }}
      onTabNavigate={(route) => {
        navigation.reset({ index: 0, routes: [{ name: tabRoutes[route] || "Home" }] });
      }}
    />
  );
}
