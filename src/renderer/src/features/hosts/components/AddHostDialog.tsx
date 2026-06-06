import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from "@mui/material";
import type { NewHostChangeHandler, NewHostState } from "../types";
import { useCreateHost } from "../hooks/useHosts";

interface AddHostDialogProps {
  open: boolean;
  onClose: () => void;
  newHost: NewHostState;
  onNewHostChange: NewHostChangeHandler;
}

export const AddHostDialog: React.FC<AddHostDialogProps> = ({
  open,
  onClose,
  newHost,
  onNewHostChange
}) => {
  const createHost = useCreateHost();
  const handleSubmit = () => {
    createHost.mutate(
      {
        host: newHost.host,
        provider: newHost.provider,
        path: newHost.path,
        ftpCredential: {
          host: newHost.ftpHost,
          port: newHost.ftpPort,
          username: newHost.ftpUsername,
          password: newHost.ftpPassword
        },
        ftpRoot: newHost.ftpRoot
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Host</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Host Name"
            value={newHost.host}
            onChange={onNewHostChange("host")}
            fullWidth
            required
            helperText="A friendly name for this host"
          />
          <TextField
            label="Host Path (HTTP URL)"
            value={newHost.path}
            onChange={onNewHostChange("path")}
            fullWidth
            helperText="URL path for streaming (e.g., /audio). Combined with host for HTTP access."
          />
          <FormControl fullWidth required>
            <InputLabel>Provider</InputLabel>
            <Select
              value={newHost.provider}
              label="Provider"
              onChange={onNewHostChange("provider")}
            >
              <MenuItem value="infinityfree.net">infinityfree.net</MenuItem>
              <MenuItem value="awardspace.net">awardspace.net</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="FTP Host"
            value={newHost.ftpHost}
            onChange={onNewHostChange("ftpHost")}
            fullWidth
            required
            helperText="Default: ftpupload.net"
          />
          <TextField
            label="FTP Port"
            type="number"
            value={newHost.ftpPort}
            onChange={onNewHostChange("ftpPort")}
            fullWidth
            required
          />
          <TextField
            label="FTP Username"
            value={newHost.ftpUsername}
            onChange={onNewHostChange("ftpUsername")}
            fullWidth
            required
          />
          <TextField
            label="FTP Password"
            type="password"
            value={newHost.ftpPassword}
            onChange={onNewHostChange("ftpPassword")}
            fullWidth
            required
          />
          <TextField
            label="FTP Root Directory"
            value={newHost.ftpRoot}
            onChange={onNewHostChange("ftpRoot")}
            fullWidth
            required
            helperText="FTP server directory (e.g., /htdocs)"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={createHost.isPending}>
          Add Host
        </Button>
      </DialogActions>
    </Dialog>
  );
};
