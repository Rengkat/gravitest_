import GravitasLogoMark from "@/lib/components/gravitas-logo";
import { NAV_ITEMS } from "@/lib/constants/dashboard";
import { LogOut, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { performLogout } from "@/lib/api/auth";

type SideBarProps = {
  sidebarOpen: boolean;
  closeSidebar: () => void;
  isParentView: boolean;
};

const SideBar = ({ sidebarOpen, closeSidebar, isParentView }: SideBarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await performLogout();
    router.replace("/login");
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-72 bg-white border-r z-50 transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ borderColor: "rgba(30,80,50,0.1)" }}>
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: "rgba(30,80,50,0.1)" }}>
        <Link href="/dashboard" onClick={closeSidebar} className="flex items-center gap-2">
          <GravitasLogoMark />
          <span className="font-serif text-xl font-bold" style={{ color: "#0d2b1a" }}>
            Gravitest
          </span>
          {isParentView && (
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "#f5c84220", color: "#d4a017" }}>
              Parent View
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
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
          <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-green-900 truncate">
              {user ? `${user.firstName} ${user.lastName}` : "…"}
            </div>
            <div className="text-[11px] text-text-muted truncate">{user?.email ?? ""}</div>
          </div>
          <button
            title="logout"
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50">
            {loggingOut ? (
              <Loader2 size={16} className="text-text-muted animate-spin" />
            ) : (
              <LogOut size={16} className="text-text-muted" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SideBar;
