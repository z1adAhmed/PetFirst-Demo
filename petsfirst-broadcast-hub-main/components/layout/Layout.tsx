import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../../constants";
import AppHeader from "./AppHeader";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <div className="h-1.5 bg-[#00A89E] w-full" />
      <AppHeader />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">{children}</main>

      <footer className="mt-12 sm:mt-20 py-12 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 text-center">
          <BrandLogo />
          <p className="mt-4 sm:mt-6 text-slate-400 text-xs sm:text-sm font-medium max-w-md mx-auto leading-relaxed">
            Proudly serving the UAE pet community. Our mission is to provide
            world-class care through seamless communication.
          </p>
          <p className="mt-8 sm:mt-12 text-[10px] text-slate-300 font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} PetsFirst Veterinary Clinic UAE. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
