
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Debug logs
  if (error) {
    console.log('❌ Auth error:', error);
  }
  if (user) {
    console.log('✅ User authenticated:', user);
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
