import { Link } from "@tanstack/react-router";
import type { FormEvent } from "react";

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const submit = (e: FormEvent) => e.preventDefault();
  const field = "mt-1.5 w-full rounded-[12px] border border-input bg-surface px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring";
  return (
    <main className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-14 sm:px-6 md:grid-cols-2 md:py-20">
      <div className="rise hidden md:block">
        <h1 className="text-5xl font-bold leading-tight">{isLogin ? "Welcome back." : "Keep your guard up."}</h1>
        <p className="mt-4 max-w-[38ch] text-muted-foreground">
          {isLogin ? "Log in to see your scan history and pick up where you left off." : "Create a free account to save scans and track the scam patterns you encounter."}
        </p>
      </div>
      <form onSubmit={submit} className="rise glass-strong rounded-[22px] p-6 sm:p-8 [animation-delay:80ms]">
        <h2 className="text-2xl font-bold">{isLogin ? "Log in" : "Create account"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link to={isLogin ? "/signup" : "/login"} className="font-medium text-primary hover:underline">{isLogin ? "Sign up" : "Log in"}</Link>
        </p>
        {!isLogin && (
          <label className="mt-6 block text-sm font-medium">Name<input className={field} placeholder="Alex Morgan" autoComplete="name" /></label>
        )}
        <label className={`${isLogin ? "mt-6" : "mt-4"} block text-sm font-medium`}>Email<input type="email" className={field} placeholder="you@university.edu" autoComplete="email" /></label>
        <label className="mt-4 block text-sm font-medium">
          <span className="flex justify-between">Password{isLogin && <a className="font-normal text-muted-foreground hover:text-foreground">Forgot?</a>}</span>
          <input type="password" className={field} placeholder="••••••••" autoComplete={isLogin ? "current-password" : "new-password"} />
        </label>
        <button className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{isLogin ? "Log in" : "Create account"}</button>
        <p className="mt-4 text-center text-xs text-muted-foreground">Accounts are coming soon — this is a preview of the sign-in experience.</p>
      </form>
    </main>
  );
}
