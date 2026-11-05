import { ICON_REGISTRY } from "@/lib/site-content/icons";

interface Props {
  name?: string | null;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Rendered when the name is empty or unknown. */
  fallback?: React.ReactNode;
}

/** Renders an admin-chosen lucide icon by name; unknown/empty names render the fallback (default: nothing). */
export default function DynamicIcon({ name, size = 18, strokeWidth = 1.75, className, fallback = null }: Props) {
  const Icon = name ? ICON_REGISTRY[name] : undefined;
  if (!Icon) return <>{fallback}</>;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
