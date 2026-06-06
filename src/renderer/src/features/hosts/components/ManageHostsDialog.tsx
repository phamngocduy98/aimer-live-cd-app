import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
  IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";
import { useDeleteHost, useHostFiles, useHosts } from "../hooks/useHosts";

interface ManageHostsDialogProps {
  open: boolean;
  onClose: () => void;
  onAddHostClick: () => void;
}

const HostFiles = ({ hostId }: { hostId: string }) => {
  const { data, isLoading, isError } = useHostFiles(hostId);

  if (isLoading) return <CircularProgress size={16} />;
  if (isError || !data?.available) {
    return (
      <Typography variant="caption" color="error.main">
        Unavailable
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="caption" color="success.main">
        Available - {data.files.length} titles found
      </Typography>
      {data.files.length > 0 && (
        <List dense sx={{ maxHeight: 120, overflow: "auto", py: 0, mt: 0.5 }}>
          {data.files.map((file) => (
            <ListItem key={file.fileName} sx={{ py: 0, pl: 1 }}>
              <ListItemText
                primary={`${file.title} (${file.fileName}): ${file.parts} - ${file.fileCount} files`}
                primaryTypographyProps={{ variant: "caption" }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export const ManageHostsDialog: React.FC<ManageHostsDialogProps> = ({
  open,
  onClose,
  onAddHostClick
}) => {
  const { data: hosts = [], isLoading } = useHosts();
  const deleteHost = useDeleteHost();
  const [expandedHostId, setExpandedHostId] = useState<string | null>(null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Hosts</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <CircularProgress sx={{ display: "block", margin: "24px auto" }} />
        ) : (
          <List>
            {hosts.length === 0 ? (
              <Typography sx={{ padding: 2, color: "text.secondary" }}>No hosts found.</Typography>
            ) : (
              hosts.map((host) => (
                <ListItem
                  key={host._id}
                  sx={{ flexDirection: "column", alignItems: "flex-start", py: 1 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <ListItemText
                      primary={host.name}
                      secondary={`${host.provider}${host.path ? ` • ${host.path}` : ""}`}
                      sx={{ flex: 1 }}
                    />
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", ml: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          setExpandedHostId((current) => (current === host._id ? null : host._id))
                        }
                      >
                        List Files
                      </Button>
                      <IconButton
                        edge="end"
                        onClick={() => deleteHost.mutate(host._id)}
                        size="small"
                        disabled={deleteHost.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {expandedHostId === host._id && (
                    <Box sx={{ mt: 1, pl: 2, width: "100%" }}>
                      <HostFiles hostId={host._id} />
                    </Box>
                  )}
                </ListItem>
              ))
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onAddHostClick}>Add Host</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
