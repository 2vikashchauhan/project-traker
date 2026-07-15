"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Box,
  Alert,
} from "@mui/material";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-Admin users
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "Admin") {
      router.replace("/");
    }
  }, [status, session, router]);

  // Fetch users
  useEffect(() => {
    if (session?.user?.role === "Admin") {
      fetchUsers();
    }
  }, [session]);

  async function fetchUsers() {
    try {
      const res = await axios.get("/api/admin/users");
      setUsers(res.data);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, event: SelectChangeEvent) {
    const newRole = event.target.value;
    setError(null);
    try {
      const res = await axios.patch(`/api/admin/users/${userId}`, {
        role: newRole,
      });
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: res.data.role } : u))
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to update role");
      }
    }
  }

  // Show loading while checking session
  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
        role="status"
        aria-label="Loading users"
      >
        <CircularProgress aria-hidden="true" />
      </Box>
    );
  }

  // Don't render for non-Admin users
  if (session?.user?.role !== "Admin") {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Users table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell
                  sx={{
                    maxWidth: 120,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.id}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onChange={(event) => handleRoleChange(user.id, event)}
                    size="small"
                    disabled={user.id === session?.user?.id}
                    aria-label={`Role for ${user.name}`}
                  >
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Member">Member</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
