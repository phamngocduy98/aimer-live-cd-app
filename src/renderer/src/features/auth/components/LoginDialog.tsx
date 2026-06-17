import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from "@mui/material";
import { useLogin } from "../hooks/useSession";

export function LoginDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const login = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [aesPassword, setAesPassword] = useState("");
  const [showAesPassword, setShowAesPassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!window.electronAPI) return;
    window.electronAPI.hasStoredAesPassword().then((stored) => {
      if (mounted) setShowAesPassword(!stored);
    });
    return () => {
      mounted = false;
    };
  }, [open]);

  const submit = () => {
    login.mutate(
      { username, password },
      {
        onSuccess: async () => {
          if (showAesPassword && aesPassword) {
            await window.electronAPI?.storeAesPassword(aesPassword);
            setShowAesPassword(false);
          }
          setPassword("");
          setAesPassword("");
          onClose();
        }
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Login</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {login.isError && <Alert severity="error">Invalid username or password</Alert>}
          <TextField
            autoFocus
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && username && password) submit();
            }}
          />
          {showAesPassword && (
            <TextField
              label="Media key"
              type="password"
              value={aesPassword}
              onChange={(event) => setAesPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && username && password) submit();
              }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={!username || !password || login.isPending}>
          Login
        </Button>
      </DialogActions>
    </Dialog>
  );
}
