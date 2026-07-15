"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { z } from "zod";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";

const loginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setIsLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          Sign In
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ width: "100%" }}
          aria-label="Login form"
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {error}
            </Alert>
          )}

          <TextField
            {...register("email")}
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            autoComplete="email"
            autoFocus
            error={!!errors.email}
            helperText={errors.email?.message}
            inputProps={{
              "aria-label": "Email",
              "aria-required": "true",
              "aria-invalid": !!errors.email,
            }}
          />

          <TextField
            {...register("password")}
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            inputProps={{
              "aria-label": "Password",
              "aria-required": "true",
              "aria-invalid": !!errors.password,
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2, minHeight: 44 }}
            aria-label={isLoading ? "Signing in..." : "Sign in"}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sign In"
            )}
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2">
              Don&apos;t have an account?{" "}
              <MuiLink component={Link} href="/register" underline="hover">
                Register
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
