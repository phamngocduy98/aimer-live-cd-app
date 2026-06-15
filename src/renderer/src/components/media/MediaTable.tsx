import React from "react";
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  tableCellClasses,
  type TableProps
} from "@mui/material";
import { styled } from "@mui/material/styles";

interface MediaTableProps {
  ariaLabel: string;
  children: React.ReactNode;
  after?: React.ReactNode;
  tableProps?: Omit<TableProps, "aria-label" | "children">;
}

export function MediaTable({
  ariaLabel,
  children,
  after,
  tableProps
}: MediaTableProps): React.ReactElement {
  return (
    <TableContainer
      sx={{
        background: "transparent",
        padding: { xs: "6px 8px", sm: "8px 0" },
        cursor: "default",
        userSelect: "none"
      }}
    >
      <Table
        size="small"
        aria-label={ariaLabel}
        sx={{ tableLayout: { xs: "fixed", sm: "auto" } }}
        {...tableProps}
      >
        {children}
      </Table>
      {after}
    </TableContainer>
  );
}

export const MediaTableHead = styled(TableHead)(({ theme }) => ({
  display: "none",
  [theme.breakpoints.up("sm")]: {
    display: "table-header-group"
  }
}));

export const MediaTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    border: 0,
    color: theme.design.color.textMuted,
    fontSize: 12
  },
  [`&.${tableCellClasses.body}`]: {
    border: 0
  }
}));

export const MediaTableRow = styled(TableRow)(({ theme }) => ({
  transition: `background-color ${theme.design.motion.fast}`,
  "&:hover": {
    backgroundColor: theme.design.color.surfaceHover
  },
  "&:last-child td, &:last-child th": {
    border: 0
  },
  "& th": {
    borderTopLeftRadius: theme.design.radius.row,
    borderBottomLeftRadius: theme.design.radius.row
  },
  "& td:last-child": {
    borderTopRightRadius: theme.design.radius.row,
    borderBottomRightRadius: theme.design.radius.row
  },
  "&.Mui-selected": {
    backgroundColor: theme.design.color.nowPlayingBackground,
    "& .now-playing-accent": {
      color: theme.design.color.nowPlaying
    }
  }
}));
