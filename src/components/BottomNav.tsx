import { Activity, Home, Plus, Users, User } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function BottomNav() {
  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/community", label: "Community", icon: Users },
    { to: "/activities", label: "Activity", icon: Activity },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav
      className="lp-bottom-nav"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="lp-nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `lp-nav-item ${isActive ? "active" : ""}`
              }
            >
              <div className="lp-nav-icon-wrap">
                <Icon size={24} strokeWidth={1.8} />
                <span className="lp-nav-label">{item.label}</span>
              </div>
            </NavLink>
          );
        })}
        <NavLink
          to="/post"
          className={({ isActive }) => `lp-nav-fab ${isActive ? "active" : ""}`}
          aria-label="Create new post"
        >
          <Plus size={28} strokeWidth={2} />
        </NavLink>
      </div>
    </nav>
  );
}
