import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { Mic, Mail, Lock, User, ArrowRight } from "lucide-react";
import clsx from "clsx";

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, loginAsGuest } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a pure frontend flow, we simulate login success using the name or email prefix
    const displayName = isLogin ? email.split("@")[0] : name;
    login(displayName || "User");
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 items-center justify-center p-4 relative overflow-hidden selection:bg-rose-500/30">
      {/* Blurred bg circles for styling */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/60 dark:bg-black/40 backdrop-blur-3xl p-8 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <Mic className="w-8 h-8 text-white transform rotate-6" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-center text-zinc-900 dark:text-white mb-2">
          Welcome to Talam
        </h1>
        <p className="text-center text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
          {isLogin ? "Sign in to continue your auditory journey." : "Create an account to save your library."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden"
              >
                <div className="pb-4">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Your Name"
                            required={!isLogin}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                        />
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 group mt-2"
          >
            {isLogin ? "Sign In" : "Sign Up"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4 before:h-px before:flex-1 before:bg-zinc-200 dark:before:bg-zinc-800 after:h-px after:flex-1 after:bg-zinc-200 dark:after:bg-zinc-800">
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Or</span>
        </div>

        <button
          onClick={loginAsGuest}
          className="w-full mt-6 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-3.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]"
        >
          Continue as Guest
        </button>

        <p className="mt-8 text-center text-sm text-zinc-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-rose-500 font-bold hover:underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}