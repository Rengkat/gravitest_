// lib/constants/settings.ts
import { Palette, Globe, Shield, Bell, Puzzle, Database, AlertTriangle } from "lucide-react";

export const ACCENT_COLORS = [
  { id: "green", label: "Green", cls: "bg-green-600", ring: "ring-green-600" },
  { id: "gold", label: "Gold", cls: "bg-gold", ring: "ring-gold" },
  { id: "blue", label: "Blue", cls: "bg-blue-600", ring: "ring-blue-600" },
  { id: "purple", label: "Purple", cls: "bg-purple-600", ring: "ring-purple-600" },
  { id: "orange", label: "Orange", cls: "bg-orange-600", ring: "ring-orange-600" },
  { id: "red", label: "Red", cls: "bg-red-600", ring: "ring-red-600" },
];

export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "yo", label: "Yorùbá (Coming Soon)" },
  { id: "ig", label: "Igbo (Coming Soon)" },
  { id: "ha", label: "Hausa (Coming Soon)" },
];

export const TIMEZONES = [
  { id: "Africa/Lagos", label: "West Africa Time (WAT) - Lagos" },
  { id: "Africa/Abidjan", label: "GMT - Abidjan" },
  { id: "Africa/Cairo", label: "Eastern European Time - Cairo" },
  { id: "Africa/Johannesburg", label: "South Africa Standard Time" },
];

export const SUBJECTS_LIST = [
  "mathematics",
  "english",
  "physics",
  "chemistry",
  "biology",
  "economics",
  "government",
  "literature",
  "history",
  "geography",
  "commerce",
  "accounting",
  "further-mathematics",
  "civic-education",
  "christian-religious-studies",
  "islamic-religious-studies",
  "agricultural-science",
  "computer-science",
  "physical-education",
  "french",
  "yoruba",
  "hausa",
  "igbo",
];

export const capitalize = (str: string) => {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const ADMIN_SETTINGS_NAV = [
  { id: "appearance", label: "Appearance", icon: Palette, description: "Brand colors & theme" },
  { id: "platform", label: "Platform", icon: Globe, description: "System configuration" },
  { id: "security", label: "Security", icon: Shield, description: "Auth & access control" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Email & SMS alerts" },
  { id: "integrations", label: "Integrations", icon: Puzzle, description: "API & third-party" },
  { id: "backup", label: "Backup", icon: Database, description: "Data & disaster recovery" },
  { id: "danger", label: "Advanced", icon: AlertTriangle, description: "System tools" },
];
