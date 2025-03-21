import styled from "@emotion/styled";
import { Song } from "../../core/Song";
import { Chip, Tooltip, tooltipClasses, TooltipProps } from "@mui/material";
import { Video } from "../../core/Video";

export const SongBitDepth: React.FC<{ song: Song }> = ({ song }) => {
  const bitdepth = [
    song.bitsPerSample ? `${song.bitsPerSample}-bit` : null,
    song.sampleRate ? `${song.sampleRate / 1000} kHz` : null
  ]
    .filter((v) => v != null)
    .join(", ");
  if (song.format === "MPEG") {
    return (
      <LowTooltip title={`Normal quality MP3 ${song.bitrate / 1000} kbps compressed audio`}>
        <BitRateChip label={`${song.bitrate / 1000} kbps`} size="small" />
      </LowTooltip>
    );
  }
  // format = flac
  if (song.bitsPerSample && song.bitsPerSample >= 24 && song.sampleRate >= 96000) {
    // MAX
    return (
      <MaxTooltip title={`Hi-Res quality FLAC ${bitdepth} lossless audio`} placement="top">
        <BitRateChip
          label={`${bitdepth}`}
          sx={{
            color: "#ffbe7d",
            bgcolor: "#332619"
          }}
          size="small"
        />
      </MaxTooltip>
    );
  }
  if (song.bitsPerSample && song.bitsPerSample >= 24) {
    // HIGH
    return (
      <HighTooltip title={`High quality FLAC ${bitdepth} lossless audio`} placement="top">
        <BitRateChip
          label={`${bitdepth}`}
          sx={{
            color: "#21feec",
            bgcolor: "#07332f"
          }}
          size="small"
        />
      </HighTooltip>
    );
  }
  // Low-res FLAC
  return (
    <LowTooltip title={`Normal quality FLAC ${bitdepth} audio`}>
      <BitRateChip label={`${bitdepth}`} size="small" />
    </LowTooltip>
  );
};

export const VideoBitDepth: React.FC<{ video: Video }> = ({ video }) => {
  const bitdepth = [
    video.audioBitsPerSample ? `${video.audioBitsPerSample}-bit` : null,
    video.audioSampleRate ? `${video.audioSampleRate / 1000} kHz` : null
  ]
    .filter((v) => v != null)
    .join(", ");

  if (
    video.audioBitsPerSample &&
    video.audioBitsPerSample >= 24 &&
    video.audioSampleRate >= 96000
  ) {
    // MAX
    return (
      <MaxTooltip
        title={`Hi-Res quality ${video.audioCodecRaw} ${bitdepth} lossless audio`}
        placement="top"
      >
        <BitRateChip
          label={`${bitdepth}`}
          sx={{
            color: "#ffbe7d",
            bgcolor: "#332619"
          }}
          size="small"
        />
      </MaxTooltip>
    );
  }
  if (video.audioBitsPerSample && video.audioBitsPerSample >= 24) {
    // HIGH
    return (
      <HighTooltip
        title={`High quality ${video.audioCodecRaw} ${bitdepth} lossless audio`}
        placement="top"
      >
        <BitRateChip
          label={`${bitdepth}`}
          sx={{
            color: "#21feec",
            bgcolor: "#07332f"
          }}
          size="small"
        />
      </HighTooltip>
    );
  }
  // Low-res FLAC
  return (
    <LowTooltip title={`Normal quality ${video.audioCodecRaw} ${bitdepth} audio`}>
      <BitRateChip label={`${bitdepth}`} size="small" />
    </LowTooltip>
  );
};

const BitRateChip = styled(Chip)(({ theme }) => ({
  letterSpacing: ".96px",
  fontSize: "10px",
  fontWeight: 700
}));
const MaxTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    color: "#ffbe7d",
    backgroundColor: "#332619",
    fontSize: 11,
    textAlign: "center",
    // @ts-ignore
    boxShadow: theme.shadows[1]
  }
}));
const HighTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    color: "#21feec",
    backgroundColor: "#07332f",
    fontSize: 11,
    textAlign: "center",
    // @ts-ignore
    boxShadow: theme.shadows[1]
  }
}));
const LowTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#242429",
    color: "white",
    fontSize: 11,
    textAlign: "center",
    // @ts-ignore
    boxShadow: theme.shadows[1]
  }
}));
