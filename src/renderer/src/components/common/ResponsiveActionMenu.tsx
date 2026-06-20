import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Slide,
  useMediaQuery,
  useTheme
} from "@mui/material";
import type { SlideProps, SxProps, Theme } from "@mui/material";

export interface ActionMenuPosition {
  top: number;
  left: number;
}

export interface ResponsiveActionMenuItem {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  color?: "default" | "error";
  closeOnClick?: boolean;
}

interface ResponsiveActionMenuProps {
  open: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  anchorPosition?: ActionMenuPosition | null;
  ariaLabel?: string;
  title?: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
  items?: ResponsiveActionMenuItem[];
  showCloseButton?: boolean;
  closeLabel?: string;
  zIndex?: number;
  desktopPaperSx?: SxProps<Theme>;
  mobileContentSx?: SxProps<Theme>;
  mobilePaperSx?: SxProps<Theme>;
}

const BottomSheetTransition = React.forwardRef(function BottomSheetTransition(
  props: SlideProps,
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function ResponsiveActionMenu({
  open,
  onClose,
  anchorEl,
  anchorPosition,
  ariaLabel,
  title,
  header,
  children,
  items = [],
  showCloseButton = false,
  closeLabel = "Close",
  zIndex = 1700,
  desktopPaperSx,
  mobileContentSx,
  mobilePaperSx
}: ResponsiveActionMenuProps): React.ReactElement {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const titleId = React.useId();
  const hasTitleLabel = Boolean(title && header);
  const dialogLabelProps = hasTitleLabel
    ? { "aria-labelledby": titleId }
    : { "aria-label": ariaLabel ?? title };

  const handleItemClick = (item: ResponsiveActionMenuItem): void => {
    if (item.disabled) return;
    if (item.closeOnClick !== false) onClose();
    item.onClick?.();
  };

  if (mobile) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        TransitionComponent={BottomSheetTransition}
        keepMounted
        {...dialogLabelProps}
        sx={{
          zIndex,
          "& .MuiDialog-container": {
            alignItems: "flex-end"
          }
        }}
        PaperProps={{
          sx: [
            {
              m: 1.5,
              mb: "max(12px, env(safe-area-inset-bottom))",
              width: "calc(100% - 24px)",
              maxWidth: 520,
              borderRadius: "22px",
              bgcolor: "#292929",
              backgroundImage: "none"
            },
            mobilePaperSx
          ] as SxProps<Theme>
        }}
      >
        <DialogContent sx={[{ p: 2.5 }, mobileContentSx] as SxProps<Theme>}>
          {header && (hasTitleLabel ? <Box id={titleId}>{header}</Box> : header)}
          {children}
          {items.length > 0 && (
            <List disablePadding sx={{ mt: header || children ? 1.5 : 0 }}>
              {items.map((item) => (
                <ListItemButton
                  key={item.label}
                  disabled={item.disabled}
                  selected={item.selected}
                  onClick={() => handleItemClick(item)}
                  sx={{
                    minHeight: 52,
                    borderRadius: 1.5,
                    px: 1.5,
                    color: item.color === "error" ? "error.main" : undefined,
                    "&.Mui-selected": { bgcolor: "rgba(255,255,255,.1)" },
                    "&.Mui-selected:hover": { bgcolor: "rgba(255,255,255,.14)" }
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: 17, fontWeight: 750 }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
          {showCloseButton && (
            <Button
              fullWidth
              onClick={onClose}
              sx={{ mt: 2, minHeight: 54, borderRadius: 2, bgcolor: "rgba(255,255,255,.12)" }}
            >
              {closeLabel}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Menu
      open={open}
      onClose={onClose}
      sx={{ zIndex }}
      anchorEl={anchorEl}
      anchorReference={anchorPosition ? "anchorPosition" : "anchorEl"}
      anchorPosition={anchorPosition ?? undefined}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: desktopPaperSx } }}
    >
      {header && <Box sx={{ px: 1.25, pt: 0.75, pb: 1 }}>{header}</Box>}
      {children}
      {items.map((item) => (
        <MenuItem
          key={item.label}
          disabled={item.disabled}
          selected={item.selected}
          onClick={() => handleItemClick(item)}
          sx={{
            color: item.color === "error" ? "error.main" : undefined,
            minHeight: 44,
            borderRadius: 1,
            fontWeight: 650
          }}
        >
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
