"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export function useUserRole() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(Boolean(data.user?.user_metadata?.is_admin));
    });
  }, []);

  return { isAdmin };
}
