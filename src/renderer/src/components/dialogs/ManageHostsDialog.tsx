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
import { ManageHostsDialogProps } from "../types";

export const ManageHostsDialog: React.FC<ManageHostsDialogProps> = ({
  open,
  onClose,
  hosts,
  isLoadingHosts,
  pingResults,
  onDeleteHost,
  onPingHost,
  onAddHostClick
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Manage Hosts</DialogTitle>
      <DialogContent>
        {isLoadingHosts ? (
          <CircularProgress sx={{ display: "block", margin: "24px auto" }} />
        ) : (
          <List>
            {hosts.length === 0 ? (
              <Typography sx={{ padding: 2, color: "text.secondary" }}>
                No hosts found.
              </Typography>
            ) : (
              hosts.map((host) => (
                <ListItem key={host._id} sx={{ flexDirection: "column", alignItems: "flex-start", py: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <ListItemText
                      primary={host.host}
                      secondary={`${host.provider}${host.path ? ` • ${host.path}` : ''}`}
                      sx={{ flex: 1 }}
                    />
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", ml: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onPingHost(host._id)}
                        disabled={pingResults[host._id]?.loading}
                      >
                        {pingResults[host._id]?.loading ? "Pinging..." : "Ping"}
                      </Button>
                      <IconButton edge="end" onClick={() => onDeleteHost(host._id)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {pingResults[host._id] && (
                    <Box sx={{ mt: 1, pl: 2, width: "100%" }}>
                      {pingResults[host._id].loading ? (
                        <CircularProgress size={16} />
                      ) : pingResults[host._id].available ? (
                        <Box>
                          <Typography variant="caption" color="success.main">
                            ✅ Available • {pingResults[host._id].files.length} titles found
                          </Typography>
                          {pingResults[host._id].files.length > 0 && (
                            <List dense sx={{ maxHeight: 120, overflow: "auto", py: 0, mt: 0.5 }}>
                              {pingResults[host._id].files.map((file, idx) => (
                                <ListItem key={idx} sx={{ py: 0, pl: 1 }}>
                                  <ListItemText
                                    primary={`${file.title} (${file.fileName}): ${file.parts} • ${file.fileCount} files`}
                                    primaryTypographyProps={{ variant: "caption" }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="error.main">
                          ❌ Unavailable
                          {pingResults[host._id].error && ` • ${pingResults[host._id].error}`}
                        </Typography>
                      )}
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
