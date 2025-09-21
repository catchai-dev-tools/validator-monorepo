import React from "react";
import { useLogin } from "@refinedev/core";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";

type FormValues = { email: string; password: string };

const Login: React.FC = () => {
  const { mutate: login, isLoading } = useLogin<FormValues>();
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: FormValues) => {
    login(values);
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" height="100vh" bgcolor={(t) => t.palette.background.default}>
      <Paper elevation={3} sx={{ p: 4, width: 360 }}>
        <Typography variant="h6" mb={2}>Sign in</Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField label="Email" type="email" fullWidth margin="normal" required {...register("email")} />
          <TextField label="Password" type="password" fullWidth margin="normal" required {...register("password")} />
          <Button type="submit" variant="contained" fullWidth disabled={isLoading} sx={{ mt: 2 }}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
