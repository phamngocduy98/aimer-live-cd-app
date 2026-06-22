import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  TextField
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { BrandMark } from "@components/layout/BrandMark";
import { useLogin } from "../hooks/useSession";

export function LoginDialog({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}): JSX.Element {
  const login = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [aesPassword, setAesPassword] = useState("");
  const [showAesPassword, setShowAesPassword] = useState(false);
  const inputProps = {
    disableUnderline: true,
    sx: {
      height: 56,
      px: 2.5,
      border: "1px solid transparent",
      borderRadius: "16px",
      boxSizing: "border-box",
      bgcolor: "rgba(255, 255, 255, 0.1)",
      color: "#fff",
      fontSize: 16,
      fontWeight: 600,
      overflow: "hidden",
      "&:hover": {
        bgcolor: "rgba(255, 255, 255, 0.14)"
      },
      "&.Mui-focused": {
        bgcolor: "#000",
        borderColor: "#fff"
      },
      "& .MuiFilledInput-input": {
        p: 0,
        height: "56px",
        lineHeight: "56px",
        boxSizing: "border-box",
        color: "#fff",
        "&::placeholder": {
          color: "rgba(255,255,255,.48)",
          opacity: 1
        }
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!window.electronAPI) return;
    window.electronAPI.hasStoredAesPassword().then((stored) => {
      if (mounted) setShowAesPassword(!stored);
    });
    return (): void => {
      mounted = false;
    };
  }, [open]);

  const submit = (): void => {
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
    <Dialog open={open} onClose={onClose} fullScreen aria-label="Login">
      <IconButton
        aria-label="Close login"
        onClick={onClose}
        sx={{
          position: "fixed",
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1,
          width: 36,
          height: 36,
          color: "rgba(255,255,255,.72)",
          bgcolor: "rgba(255,255,255,.08)",
          "&:hover": {
            bgcolor: "rgba(255,255,255,.14)",
            color: "#fff"
          }
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <DialogContent
        sx={{
          display: "flex",
          justifyContent: "center",
          minHeight: "100dvh",
          px: { xs: 3, sm: 4 },
          py: { xs: 7, sm: 8 },
          bgcolor: "#000",
          fontFamily: "nationale, nationale-regular, helvetica, arial, sans-serif"
        }}
      >
        <Stack
          component="form"
          spacing={2.5}
          onSubmit={(event) => {
            event.preventDefault();
            if (username && password) submit();
          }}
          sx={{
            width: "min(100%, 460px)",
            alignItems: "stretch"
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: { xs: 8, sm: 10 }
            }}
          >
            <BrandMark size={18} />
          </Box>
          <Box
            id="login-title"
            component="h2"
            sx={{
              padding: "40px 0",
              color: "#fff",
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.15,
              textAlign: "center"
            }}
          >
            Log In
          </Box>
          {login.isError && <Alert severity="error">Invalid username or password</Alert>}
          <TextField
            autoFocus
            aria-label="Username"
            placeholder="Email or username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            variant="filled"
            InputProps={inputProps}
          />
          <TextField
            aria-label="Password"
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && username && password) submit();
            }}
            variant="filled"
            InputProps={inputProps}
          />
          {showAesPassword && (
            <TextField
              aria-label="Media key"
              placeholder="Media key"
              type="password"
              value={aesPassword}
              onChange={(event) => setAesPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && username && password) submit();
              }}
              variant="filled"
              InputProps={inputProps}
            />
          )}
          <Button
            type="submit"
            disabled={!username || !password || login.isPending}
            sx={{
              mt: 1,
              height: 56,
              borderRadius: "16px",
              bgcolor: "#fff",
              color: "#050505",
              fontSize: 16,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "rgba(255,255,255,.88)",
                boxShadow: "none"
              },
              "&.Mui-disabled": {
                bgcolor: "#fff",
                color: "#111",
                opacity: 0.42
              }
            }}
          >
            Log In
          </Button>
          <Stack spacing={2.25} sx={{ alignItems: "center", pt: 3.5 }}>
            <Button
              type="button"
              variant="text"
              onClick={() => alert("God bless you!")}
              sx={{
                minWidth: 0,
                p: 0,
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.3,
                textDecoration: "underline",
                textUnderlineOffset: "5px",
                textTransform: "none",
                "&:hover": {
                  bgcolor: "transparent",
                  textDecoration: "underline"
                }
              }}
            >
              Forgot your password?
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
