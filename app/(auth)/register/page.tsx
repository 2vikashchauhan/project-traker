"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { z } from "zod";
import axios from "axios";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";

const registerFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters"),
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.post("/api/auth/register", {
        email: data.email,
        password: data.password,
        name: data.name,
      });

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result?.error) {
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setError("Email already in use");
        } else if (err.response?.data?.fieldErrors) {
          setError(err.response.data.message || "Validation error");
        } else {
          setError("An error occurred. Please try again.");
        }
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          py: 4,
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sign up to get started with Project Tracker
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ width: "100%" }}
        >
          <TextField
            {...register("name")}
            label="Name"
            fullWidth
            margin="normal"
            error={!!errors.name}
            helperText={errors.name?.message}
            autoComplete="name"
            autoFocus
            id="name"
            aria-describedby={errors.name ? "name-helper-text" : undefined}
          />
          <TextField
            {...register("email")}
            label="Email Address"
            type="email"
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email?.message}
            autoComplete="email"
            id="email"
            aria-describedby={errors.email ? "email-helper-text" : undefined}
          />
          <TextField
            {...register("password")}
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            error={!!errors.password}
            helperText={errors.password?.message}
            autoComplete="new-password"
            id="password"
            aria-describedby={
              errors.password ? "password-helper-text" : undefined
            }
          />
          <TextField
            {...register("confirmPassword")}
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            autoComplete="new-password"
            id="confirmPassword"
            aria-describedby={
              errors.confirmPassword
                ? "confirmPassword-helper-text"
                : undefined
            }
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
          <Box sx={{ textAlign: "center" }}>
            <MuiLink component={Link} href="/login" variant="body2">
              Already have an account? Sign in
            </MuiLink>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
