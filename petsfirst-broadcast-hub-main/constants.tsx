export const COLORS = {
  primary: "#00A89E", // Pets First Teal
  primaryHover: "#008e85",
  secondary: "#FF6F61", // Coral accent
  accent: "#1E293B", // Deep navy
  background: "#F1F5F9",
  card: "#FFFFFF",
  border: "#E2E8F0",
};

export const SAMPLE_CSV_CONTENT = `Name,Phone
Ali Raza,+918122334455
John Doe,+918122334455
Jane Smith,+918122334455`;

export const BrandLogo = () => (
  <div className="flex items-center space-x-2">
    <div
      className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-teal-50 border border-teal-100 shadow-sm overflow-hidden flex items-center justify-center"
      aria-hidden="true"
      title="PetsFirst"
    >
      <img
        src="/icon.png"
        alt="PetsFirst brand"
        className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
      />
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-xl font-black tracking-tighter text-slate-800 uppercase">
        PetsFirst
      </span>
      <span className="text-[10px] font-bold text-[#00A89E] uppercase tracking-[0.2em]">
        Veterinary Clinic
      </span>
    </div>
  </div>
);

export const PawIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M4.5 10c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zm4.5-4c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zm6 0c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zm4.5 4c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zm-7.5 7c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5z" />
  </svg>
);
