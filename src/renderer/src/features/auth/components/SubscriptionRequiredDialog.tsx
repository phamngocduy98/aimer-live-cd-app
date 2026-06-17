import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { hideSubscriptionPrompt } from "../store/authSlice";

export function SubscriptionRequiredDialog() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.auth.subscriptionPromptOpen);

  return (
    <Dialog open={open} onClose={() => dispatch(hideSubscriptionPrompt())} maxWidth="xs" fullWidth>
      <DialogTitle>Subscription required</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          Songs and locally hosted videos require an active subscription. You can still play
          YouTube videos as a guest.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(hideSubscriptionPrompt())}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
