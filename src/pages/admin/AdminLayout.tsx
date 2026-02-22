import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Contracts", href: "/admin/contracts", icon: FileText },
    { name: "Support", href: "/admin/support", icon: MessageSquare },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-muted/20">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r bg-background pt-6">
        <div className="px-6 pb-6 border-b flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <span className="font-semibold text-lg tracking-tight">
            Admin Panel
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
