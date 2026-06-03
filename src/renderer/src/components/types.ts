import { Host } from "../api/api";
import { SelectChangeEvent } from "@mui/material/Select";

export interface ListFilesResult {
  loading: boolean;
  available: boolean | null;
  files: { fileName: string; parts: string; title: string; fileCount: number }[];
  error?: string;
}

export interface NewHostState {
  host: string;
  provider: string;
  path: string;
  ftpHost: string;
  ftpPort: number;
  ftpUsername: string;
  ftpPassword: string;
  ftpRoot: string;
}

export interface ManageHostsDialogProps {
  open: boolean;
  onClose: () => void;
  hosts: Host[];
  isLoadingHosts: boolean;
  fileListResults: Record<string, ListFilesResult>;
  onDeleteHost: (hostId: string) => void;
  onListHostFiles: (hostId: string) => void;
  onAddHostClick: () => void;
}

export interface AddHostDialogProps {
  open: boolean;
  onClose: () => void;
  newHost: NewHostState;
  onNewHostChange: (
    field: string
  ) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => void;
  onSubmit: () => void;
}

export interface SidebarProps {
  drawerWidth: number;
}

export interface TopNavBarProps {
  drawerWidth: number;
  isMenuOpen: boolean;
  anchorEl: HTMLElement | null;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClose: () => void;
  onManageHostsClick: () => void;
  onBackClick: () => void;
}
