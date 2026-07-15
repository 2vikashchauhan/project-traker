"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CircularProgress, Box } from "@mui/material";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        role="status"
        aria-label="Checking authentication"
      >
        <CircularProgress aria-hidden="true" />
      </Box>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  return <>{children}</>;
}
