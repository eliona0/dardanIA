export const mockCases = [
  {
    id: "case-1",
    category: "Accessibility",
    coordinates: { latitude: 42.6629, longitude: 21.1655 },
    description:
      "A sidewalk ramp near Mother Teresa Boulevard is blocked and difficult to access for wheelchair users.",
    icon: "walk-outline",
    recommendations: [
      "Clear the blocked ramp access.",
      "Add temporary signage until the obstruction is removed.",
      "Inspect nearby sidewalks for similar access barriers.",
    ],
    severity: "high",
    title: "Blocked ramp near Mother Teresa Boulevard",
  },
  {
    id: "case-2",
    category: "Road damage",
    coordinates: { latitude: 42.6578, longitude: 21.1584 },
    description:
      "A large pothole in Dardania is creating risk for vehicles, cyclists, and pedestrians crossing the street.",
    icon: "construct-outline",
    recommendations: [
      "Schedule urgent road maintenance.",
      "Place a temporary hazard marker near the damaged section.",
    ],
    severity: "medium",
    title: "Large pothole reported in Dardania",
  },
  {
    id: "case-3",
    category: "Public lighting",
    coordinates: { latitude: 42.6662, longitude: 21.1739 },
    description:
      "Street lighting near a school entrance is not working, reducing visibility in the evening.",
    icon: "bulb-outline",
    recommendations: [
      "Replace or repair the faulty light.",
      "Check adjacent poles for related electrical issues.",
    ],
    severity: "low",
    title: "Street light outage near school entrance",
  },
];
