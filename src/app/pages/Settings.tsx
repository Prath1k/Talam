import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";

export function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white/60 dark:bg-black/60 backdrop-blur-xl p-6 md:p-8 lg:p-12 relative z-10 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8 pb-32">
        <header>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">
            Settings
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Manage your preferences and account details.
          </p>
        </header>

        <section className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-rose-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {user?.name || "User"}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                {user?.isGuest ? "Guest Account" : "Registered User"}
              </p>
            </div>
          </div>



          <div className="mt-12 pt-8 border-t border-black/10 dark:border-white/10">
            <button
              onClick={logout}
              className="flex items-center gap-3 text-red-500 hover:text-red-600 font-bold transition-colors px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}