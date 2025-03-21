import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  Box,
  TableCell,
  tableCellClasses,
  tableRowClasses,
  IconButton,
  Typography
} from "@mui/material";
import styled from "@emotion/styled";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { reset } from "../../store/player/playerSlice";
import { formatDuration } from "../../utils/formatDuration";
import { AlbumDetail } from "../../core/Album";
import { useAppDispatch, useAppSelector } from "../../store/hook";

export const SongListTable: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();
  const { playingTrack } = useAppSelector((state) => state.player);

  return (
    <TableContainer
      sx={{
        background: "black",
        padding: {
          xs: "8px 16px",
          sm: "8px 24px"
        },
        cursor: "default",
        userSelect: "none"
      }}
    >
      <Table
        size="small"
        aria-label="a dense table"
        sx={{
          tableLayout: {
            xs: "fixed",
            sm: "auto"
          }
        }}
      >
        <TableHead sx={{ display: { xs: "none", sm: "table-header-group" } }}>
          <TableRow>
            <NoBorderTableCell align="center" width={30}>
              #
            </NoBorderTableCell>
            <NoBorderTableCell>TITLE</NoBorderTableCell>
            <NoBorderTableCell>ARTIST</NoBorderTableCell>
            <NoBorderTableCell align="center">TIME</NoBorderTableCell>
            <NoBorderTableCell align="center" width={30}></NoBorderTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {album.trackList.map((track, idx) => (
            <TableRow
              hover
              key={track._id}
              selected={track._id === playingTrack?._id}
              // onClick={() =>
              //   dispatch(reset({ songs: album.trackList.slice(idx) }))
              // }
              onDoubleClick={() =>
                dispatch(
                  reset({
                    songs: album.trackList.slice(idx),
                    history: album.trackList.slice(0, idx),
                    type: "audio"
                  })
                )
              }
              sx={{
                "&:last-child td, &:last-child th": {
                  border: 0
                },
                "& th": {
                  borderTopLeftRadius: "5px",
                  borderBottomLeftRadius: "5px",
                  border: 1
                },
                "& td:last-child": {
                  borderTopRightRadius: "5px",
                  borderBottomRightRadius: "5px"
                },
                "&.Mui-selected": {
                  backgroundColor: "#ffffff1a"
                }
              }}
            >
              <NoBorderTableCell align="center" component="th" scope="row" width={30}>
                {track._id !== playingTrack?._id ? (
                  <Typography fontSize="14px" fontWeight={500} color="#79777f">
                    {track.trackNo}
                  </Typography>
                ) : (
                  <VolumeUpIcon style={{ width: 16, height: 16 }} />
                )}
              </NoBorderTableCell>
              <NoBorderTableCell>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <Box>
                    <Typography noWrap textOverflow="ellipsis" fontSize={"14px"}>
                      {track.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: { xs: "block", sm: "none" } }}>
                    <Typography noWrap textOverflow="ellipsis" fontSize={"14px"}>
                      {track.artist}
                    </Typography>
                  </Box>
                </Box>
              </NoBorderTableCell>
              <NoBorderTableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                {track.artist}
              </NoBorderTableCell>
              <NoBorderTableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                {formatDuration(track.duration)}
              </NoBorderTableCell>
              <NoBorderTableCell align="center" width={60}>
                <IconButton size="small" onClick={() => null}>
                  <MoreHorizIcon fontSize="medium" />
                </IconButton>
              </NoBorderTableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const NoBorderTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    border: 0
  },
  [`&.${tableCellClasses.body}`]: {
    border: 0
  }
}));
