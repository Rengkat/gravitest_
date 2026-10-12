import { useState, useEffect } from "react";
import GravitasLogoMark from "@/lib/components/gravitas-logo";
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  FileText,
  CreditCard,
  Repeat,
  Bot,
  Settings,
  LogOut,
  User,
  BookOpen,
  GraduationCap,
  CalendarCheck,
  Shield,
  Gamepad2,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Activity,
  MessageSquare,
  DollarSign,
  Target,
  Clock,
  Sparkles,
  Brain,
  Crown,
  BadgePercent,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { performLogout } from "@/lib/api/auth";

type NavItem = {
  href?: string;
  label: string;
  icon: any;
  exact?: boolean;
  isDropdown?: boolean;
  children?: {
    href: string;
    label: string;
    icon: any;
    badge?: number;
    exact?: boolean;
  }[];
};

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Platform Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/admin/questions",
    label: "Question Bank",
    icon: HelpCircle,
  },
  {
    href: "/admin/leaderboard",
    label: "Leaderboard",
    icon: Crown,
  },
  {
    href: "/admin/contents",
    label: "Content Library",
    icon: FileText,
  },
  {
    href: "/admin/transactions",
    label: "Transactions",
    icon: CreditCard,
  },
  {
    href: "/admin/billing",
    label: "Plans & Access",
    icon: BadgePercent,
  },
  {
    label: "AI Logs",
    icon: Bot,
    isDropdown: true,
    children: [
      {
        href: "/admin/ai-logs",
        label: "Overview",
        icon: BarChart3,
        exact: true,
      },
      {
        href: "/admin/ai-logs/conversations",
        label: "Conversations",
        icon: MessageSquare,
        badge: 234,
      },
      {
        href: "/admin/ai-logs/cost",
        label: "Cost Analytics",
        icon: DollarSign,
      },
      {
        href: "/admin/ai-logs/performance",
        label: "Performance",
        icon: Activity,
      },
      {
        href: "/admin/ai-logs/scoring",
        label: "AI Scoring",
        icon: Target,
      },
      {
        href: "/admin/ai-logs/prompts",
        label: "System Prompts",
        icon: Sparkles,
      },
      {
        href: "/admin/ai-logs/limits",
        label: "Rate Limits",
        icon: Clock,
      },
      {
        href: "/admin/ai-logs/models",
        label: "Model Management",
        icon: Brain,
      },
      {
        href: "/admin/ai-logs/flagged",
        label: "Flagged Content",
        icon: Shield,
      },
      {
        href: "/admin/ai-logs/settings",
        label: "AI Settings",
        icon: Settings,
      },
    ],
  },
  {
    href: "/admin/games",
    label: "Game",
    icon: Gamepad2,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
];

type AdminSideBarProps = {
  sidebarOpen: boolean;
  closeSidebar: () => void;
};

const AdminSideBar = ({ sidebarOpen, closeSidebar }: AdminSideBarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loggingOut, setLoggingOut] = useState(false);
  const [expandedDropdowns, setExpandedDropdowns] = useState<string[]>([]);

  async function handleLogout() {
    setLoggingOut(true);
    await performLogout();
    router.replace("/login");
  }

  // Load expanded state from localStorage on mount, but ALSO auto-expand
  // any dropdown whose child route is currently active — otherwise a page
  // refresh on e.g. /admin/ai-logs/cost would land with the dropdown closed
  // and no visible active link, which reads as "nothing is highlighted".
  useEffect(() => {
    const saved = localStorage.getItem("adminSidebarExpanded");
    let initial: string[] = [];
    if (saved) {
      try {
        initial = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved sidebar state");
      }
    }

    const activeDropdown = ADMIN_NAV_ITEMS.find(
      (item) =>
        item.isDropdown && item.children?.some((child) => isActiveHref(child.href, child.exact)),
    );
    if (activeDropdown && !initial.includes(activeDropdown.label)) {
      initial = [...initial, activeDropdown.label];
    }

    setExpandedDropdowns(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem("adminSidebarExpanded", JSON.stringify(expandedDropdowns));
  }, [expandedDropdowns]);

  const toggleDropdown = (label: string) => {
    setExpandedDropdowns((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  // Exact-match routes (like the AI Logs "Overview" link at /admin/ai-logs)
  // must NOT highlight when a deeper sub-route like /admin/ai-logs/cost is
  // active. Only routes explicitly marked exact get this stricter check;
  // everything else still uses startsWith so /admin/users/123 highlights
  // the "Users" parent link.
  function isActiveHref(href: string, exact?: boolean) {
    if (!pathname) return false;
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  const isChildActive = (children: { href: string; exact?: boolean }[] = []) =>
    children.some((child) => isActiveHref(child.href, child.exact));

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-72 bg-white border-r z-50 transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ borderColor: "rgba(30,80,50,0.1)" }}>
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: "rgba(30,80,50,0.1)" }}>
        <Link href="/admin" onClick={closeSidebar} className="flex items-center gap-2">
          <GravitasLogoMark />
          <span className="font-serif text-xl font-bold" style={{ color: "#0d2b1a" }}>
            Gravitest
          </span>
          <span
            className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: "#ef444415", color: "#ef4444" }}>
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          if (item.isDropdown) {
            const isExpanded = expandedDropdowns.includes(item.label);
            const hasActiveChild = isChildActive(item.children);

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleDropdown(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                    hasActiveChild
                      ? "bg-green-800 text-white"
                      : "text-text-muted hover:bg-green-500/5 hover:text-green-800"
                  }`}>
                  <div className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={1.8} />
                    <span className="text-[14px] font-medium">{item.label}</span>
                  </div>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-green-100 pl-3">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      const active = isActiveHref(child.href, child.exact);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={closeSidebar}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-[13px] ${
                            active
                              ? "bg-green-800 text-white"
                              : "text-text-muted hover:bg-green-500/5 hover:text-green-800"
                          }`}>
                          <div className="flex items-center gap-2">
                            <ChildIcon size={14} />
                            <span>{child.label}</span>
                          </div>
                          {child.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                active ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                              }`}>
                              {child.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = isActiveHref(item.href || "", item.exact);

          return (
            <Link
              key={item.href}
              href={item.href || "#"}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-green-800 text-white"
                  : "text-text-muted hover:bg-green-500/5 hover:text-green-800"
              }`}>
              <Icon size={18} strokeWidth={1.8} />
              <span className="text-[14px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div
        className="absolute bottom-0 left-0 right-0 py-[0.2rem] px-4 border-t"
        style={{ borderColor: "rgba(30,80,50,0.1)" }}>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-cream">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <Shield size={18} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-green-900 truncate">
              {user ? `${user.firstName} ${user.lastName}` : "…"}
            </div>
            <div className="text-[11px] text-text-muted truncate">
              {user?.role === "super_admin" ? "Super Admin" : "Admin"}
            </div>
          </div>
          <button
            title="logout"
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50">
            <LogOut size={16} className="text-text-muted" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSideBar;
