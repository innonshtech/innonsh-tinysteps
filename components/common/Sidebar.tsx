"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PERMISSIONS } from "@/utils/permissions";
import { useState, useEffect, ComponentType } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  IndianRupee,
  Calendar,
  FileText,
  Bell,
  PartyPopper,
  Bus,
  House,
  // UtensilsCrossed, // Meal Plan (hidden)
  Image,
  Settings,
  Baby,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Clock,
  UserPlus,
} from "lucide-react";

interface User {
  name?: string;
  role?: string;
}

interface MenuItem {
  name: string;
  path: string;
  module: string;
  icon: ComponentType<{ className?: string }>;
  color: "orange" | "pink" | "rose" | "purple" | "amber" | "green" | "fuchsia" | "indigo" | "red" | "yellow" | "cyan" | "violet" | "slate";
}

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Keep sidebar visible on all dashboard routes so it stays present
  // across admin modules (but still allow mobile toggle via `isOpen`).
  // use isOpen prop to control visibility on mobile
  // lg:translate-x-0 class ensures it's always visible on desktop
  const visible = isOpen;
  
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchFlags = () => {
      fetch("/api/settings")
        .then(r => r.json())
        .then(d => {
          if (d.success && d.settings?.featureFlags) {
            setFeatureFlags(d.settings.featureFlags);
          }
        })
        .catch(e => console.error("Failed to load feature flags", e));
    };

    // Initial fetch
    fetchFlags();

    // Listen for custom event from Settings page
    window.addEventListener("feature-flags-updated", fetchFlags);

    return () => {
      window.removeEventListener("feature-flags-updated", fetchFlags);
    };
  }, []);

  const getDashboardPath = () => {
    switch (user?.role) {
      case "teacher": return "/teacher-dashboard";
      case "student": return "/student-dashboard";
      case "parent": return "/parent-dashboard";
      default: return "/dashboard";
    }
  };

  const basePath = getDashboardPath();

  const menuList: MenuItem[] = [
    {
      name: "Dashboard",
      path: basePath,
      module: "dashboard",
      icon: LayoutDashboard,
      color: "orange",
    },
    {
      name: "Classes",
      path: `${basePath}/classes`,
      module: "classes",
      icon: House,
      color: "pink",
    },
    {
      name: "Admissions",
      path: `${basePath}/admission`,
      module: "admission",
      icon: UserPlus,
      color: "violet",
    },
    {
      name: "Students",
      path: `${basePath}/students`,
      module: "students",
      icon: Users,
      color: "rose",
    },
    {
      name: "Teachers",
      path: `${basePath}/teachers`,
      module: "teachers",
      icon: GraduationCap,
      color: "purple",
    },
    {
      name: "Attendance",
      path: `${basePath}/attendance`,
      module: "attendance",
      icon: ClipboardCheck,
      color: "amber",
    },
    {
      name: "Fees",
      path: `${basePath}/fees`,
      module: "fees",
      icon: IndianRupee,
      color: "green",
    },
    {
      name: "Timetable",
      path: `${basePath}/timetable`,
      module: "timetable",
      icon: Calendar,
      color: "fuchsia",
    },
    {
      name: "Exams",
      path: `${basePath}/exams`,
      module: "exams",
      icon: FileText,
      color: "indigo",
    },
    {
      name: "Leaves",
      path: `${basePath}/leaves`,
      module: "leaves",
      icon: Clock,
      color: "red",
    },
    /* Previously Notifications. Kept as comment so original implementation remains available */
    /*
    {
      name: "Notifications",
      path: `${basePath}/notifications`,
      module: "notifications",
      icon: Bell,
      color: "red",
    },
    */
    /* Log Activity hidden for small school client 
    {
      name: "Log Activity",
      path: `${basePath}/log-activity`,
      module: "log-activity",
      icon: Clock,
      color: "red",
    },
    */
    {
      name: "Events",
      path: `${basePath}/events`,
      module: "events",
      icon: PartyPopper,
      color: "yellow",
    },
    {
      name: "Transport",
      path: `${basePath}/transport/routes`,
      module: "transport",
      icon: Bus,
      color: "cyan",
    },
    /* Meal Plan hidden — not needed for this school
    {
      name: "Meal Plan",
      path: `${basePath}/meal-plan`,
      module: "meal-plan",
      icon: UtensilsCrossed,
      color: "orange",
    },
    */
    {
      name: "Gallery",
      path: `${basePath}/gallery`,
      module: "gallery",
      icon: Image,
      color: "violet",
    },
    {
      name: "Settings",
      path: `${basePath}/settings`,
      module: "settings",
      icon: Settings,
      color: "slate",
    },
  ];

  const getColorClasses = (
    color: "orange" | "pink" | "rose" | "purple" | "amber" | "green" | "fuchsia" | "indigo" | "red" | "yellow" | "cyan" | "violet" | "slate",
    isActive: boolean
  ): string => {
    const colors: Record<string, string> = {
      orange: isActive ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600",
      pink: isActive ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-600",
      rose: isActive ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-600",
      purple: isActive ? "bg-purple-500 text-white" : "bg-purple-50 text-purple-600",
      amber: isActive ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600",
      green: isActive ? "bg-green-500 text-white" : "bg-green-50 text-green-600",
      fuchsia: isActive ? "bg-fuchsia-500 text-white" : "bg-fuchsia-50 text-fuchsia-600",
      indigo: isActive ? "bg-indigo-500 text-white" : "bg-indigo-50 text-indigo-600",
      red: isActive ? "bg-red-500 text-white" : "bg-red-50 text-red-600",
      yellow: isActive ? "bg-yellow-500 text-white" : "bg-yellow-50 text-yellow-600",
      cyan: isActive ? "bg-cyan-500 text-white" : "bg-cyan-50 text-cyan-600",
      violet: isActive ? "bg-violet-500 text-white" : "bg-violet-50 text-violet-600",
      slate: isActive ? "bg-slate-500 text-white" : "bg-slate-50 text-slate-600",
    };
    return colors[color] || colors.orange;
  };

  const filteredMenu = menuList.filter((m) => {
    // 1. Check user permissions
    const hasRoleAccess = user?.role ? PERMISSIONS[user.role]?.includes(m.module) : false;
    if (!hasRoleAccess) return false;

    // 2. Check feature flags for optional modules
    const featureMap: Record<string, string> = {
      "transport": "enableTransport",
      "meal-plan": "enableMealPlan",
      "gallery": "enableGallery",
      "events": "enableEvents",
    };

    const flagKey = featureMap[m.module];
    // If it's a togglable feature and it is explicitly set to false, hide it.
    if (flagKey && featureFlags[flagKey] === false) {
      return false;
    }

    return true;
  });

  return (
    <aside
      className={`
    fixed lg:static z-50
    h-screen bg-white border-r border-gray-200
    flex flex-col
    transition-transform duration-300
    ${visible ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0
    ${isCollapsed ? "w-16" : "w-60"}
  `}
    >


      {/* Header */}
      <div
        className={`h-[60px] border-b border-gray-200 flex items-center ${isCollapsed ? "justify-center" : "justify-between px-4"
          }`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center">
              <img src="/ICON.png" alt="Innonsh TinySteps" className="w-full h-full object-contain rounded-lg" />
            </div>
            <h1 className="text-lg font-extrabold text-gray-800 tracking-tight leading-none mt-0.5">Innonsh TinySteps</h1>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/ICON.png" alt="Innonsh TinySteps" className="w-full h-full object-contain rounded-lg" />
          </div>
        )}
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>

      </div>

      {/* User Info Removed */}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar">
        <ul className={isCollapsed ? "space-y-2 py-4" : "space-y-1 px-3 py-4"}>
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = item.module === "dashboard"
              ? pathname === item.path
              : pathname === item.path || pathname?.startsWith(item.path + "/");

            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`
              group relative flex items-center transition-all duration-150
              ${isCollapsed
                      ? "justify-center py-2.5"
                      : "px-2.5 py-2 rounded-md"
                    }
              ${isActive
                      ? "bg-gradient-to-r from-orange-50 to-pink-50 shadow-sm"
                      : "hover:bg-gray-50"
                    }
            `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div
                    className={`
                flex items-center justify-center rounded-md
                ${isCollapsed ? "w-8 h-8" : "w-7 h-7 mr-2.5"}
                ${getColorClasses(item.color, isActive)}
              `}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {!isCollapsed && (
                    <span className="text-sm font-medium text-gray-700">
                      {item.name}
                    </span>
                  )}

                  {/* Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {item.name}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>




      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div className="py-2 border-t border-gray-200">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full flex justify-center py-2 hover:bg-gray-50 transition-colors group"
            title="Expand sidebar"
          >
            <div className="w-8 h-8 rounded-md bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <PanelLeft className="w-4 h-4 text-gray-600" />
            </div>
          </button>
        </div>
      )}



      {/* Footer */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center font-medium">
            © 2026 Innonsh TinySteps
          </p>
        </div>
      )}
    </aside>
  );
}