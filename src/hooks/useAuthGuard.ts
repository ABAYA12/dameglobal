// Add this to pages that need authentication
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthGuard(requiredRole?: string) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (requiredRole && session.user.role !== requiredRole) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, requiredRole, router]);

  return { session, status };
}
