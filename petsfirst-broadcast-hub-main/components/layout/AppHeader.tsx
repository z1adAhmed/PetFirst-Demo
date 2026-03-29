import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BrandLogo } from "../../constants";

const AppHeader: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    sessionStorage.removeItem("pf_session_authed");
    localStorage.removeItem("pets_first_meta_config");
    localStorage.removeItem("pets_first_broadcast_history");
    window.location.assign("/login");
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        <BrandLogo />

        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <Link
            to="/"
            className={`relative py-1 text-sm sm:text-base font-extrabold transition-colors ${
              isActive("/")
                ? "text-[#00A89E]"
                : "text-slate-500 hover:text-slate-800"
            }`}
            aria-label="Home"
          >
            Home
            <span
              className={`absolute left-0 -bottom-2 h-0.5 bg-[#00A89E] transition-all ${
                isActive("/") ? "w-full" : "w-0"
              }`}
              aria-hidden="true"
            />
          </Link>

          <Link
            to="/templates"
            className={`relative py-1 text-sm sm:text-base font-extrabold transition-colors ${
              isActive("/templates") || location.pathname.startsWith("/upload")
                ? "text-[#00A89E]"
                : "text-slate-500 hover:text-slate-800"
            }`}
            aria-label="New Broadcast"
          >
            New Broadcast
            <span
              className={`absolute left-0 -bottom-2 h-0.5 bg-[#00A89E] transition-all ${
                isActive("/templates") ||
                location.pathname.startsWith("/upload")
                  ? "w-full"
                  : "w-0"
              }`}
              aria-hidden="true"
            />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-rose-600 transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
