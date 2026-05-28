"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { canAccess } from "@/utils/permissions";

export default function Protected({
  children,
  module,
}: {
  children: React.ReactNode;
  module: string;
}) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!canAccess(user.role, module)) {
      router.push("/unauthorized");
    }
  }, [user]);

  return <>{children}</>;
}
