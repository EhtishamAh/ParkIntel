"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function CompleteSignupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "error">("processing");

  useEffect(() => {
    const completeSignup = async () => {
      try {
        console.log("🔄 Starting complete signup process...");
        
        // Wait a bit for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get current session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Error getting session:", sessionError);
          setStatus("error");
          setTimeout(() => router.push('/login'), 2000);
          return;
        }
        
        if (!session) {
          console.log("❌ No session found, redirecting to login");
          setStatus("error");
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        console.log("✅ Session found:", session.user.id);
        
        const user = session.user;
        
        // Get the pending role from localStorage
        const pendingRole = localStorage.getItem('pendingUserRole');
        console.log("📋 Pending role from localStorage:", pendingRole);

        // If there's a pending role, update the profile
        if (pendingRole && (pendingRole === 'driver' || pendingRole === 'owner' || pendingRole === 'operator')) {
          console.log("🔄 Updating profile role to:", pendingRole);
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase as any)
            .from('profiles')
            .update({ role: pendingRole })
            .eq('id', user.id);

          if (error) {
            console.error("❌ Error updating role:", error);
            setStatus("error");
            setTimeout(() => router.push('/auth/auth-code-error'), 2000);
            return;
          }

          console.log("✅ Profile role updated successfully");
          
          // Clear the pending role
          localStorage.removeItem('pendingUserRole');
        } else {
          console.log("ℹ️ No pending role to update (likely existing user login)");
          // If no pending role, this might be an existing user who was redirected here by mistake
          // Just proceed to dashboard
        }

        // Redirect to dashboard
        console.log("🎉 Signup complete, redirecting to dashboard");
        router.push('/dashboard');
      } catch (error) {
        console.error("❌ Complete signup error:", error);
        setStatus("error");
        setTimeout(() => router.push('/auth/auth-code-error'), 2000);
      }
    };

    completeSignup();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-center space-y-4">
        {status === "processing" ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Completing your signup...
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Setting up your account
            </p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <span className="text-red-600 text-2xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Redirecting...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
