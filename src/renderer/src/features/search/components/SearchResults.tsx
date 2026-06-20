import React from "react";
import { useSearchParams } from "react-router-dom";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { PageScaffold } from "@components/view/PageScaffold";
import { SearchResultRow, useSearchResultItems } from "@components/search/SearchResultItems";
import { useSearch } from "../hooks/useSearch";

type SearchTab = "top" | "artists" | "songs" | "albums" | "videos" | "chapters";

const SEARCH_TABS: Array<{ value: SearchTab; label: string }> = [
  { value: "top", label: "Top results" },
  { value: "artists", label: "Artists" },
  { value: "songs", label: "Songs" },
  { value: "albums", label: "Albums" },
  { value: "videos", label: "Videos" },
  { value: "chapters", label: "Chapters" }
];

export const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [activeTab, setActiveTab] = React.useState<SearchTab>("top");
  const { data: result, isLoading: loading } = useSearch(q);

  React.useEffect(() => {
    setActiveTab("top");
  }, [q]);

  const playSource = React.useMemo(
    () => ({
      type: "search" as const,
      id: q,
      label: `Search: ${q}`,
      route: `/search?q=${encodeURIComponent(q)}`
    }),
    [q]
  );

  const groups = useSearchResultItems({
    result,
    query: q,
    playSource,
    topLimit: 20
  });
  const activeItems = groups[activeTab];
  const hasResults =
    result &&
    (result.songs.length > 0 ||
      result.albums.length > 0 ||
      result.videos.length > 0 ||
      result.chapters.length > 0);
  const hasQuery = q.trim().length > 0;

  return (
    <PageScaffold>
      <Box
        sx={(theme) => ({
          width: "100%",
          maxWidth: theme.design.layout.collectionWidth,
          mx: "auto",
          px: theme.design.layout.gutters,
          pt: { xs: "calc(64px + 28px)", sm: "calc(64px + 36px)" },
          pb: 3
        })}
      >
        {hasQuery && (
          <>
            <Tabs
              value={activeTab}
              onChange={(_, value: SearchTab) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Search result categories"
              sx={(theme) => ({
                minHeight: 50,
                borderBottom: `1px solid ${theme.design.color.border}`,
                "& .MuiTabs-indicator": { display: "none" },
                "& .MuiTab-root": {
                  minHeight: 42,
                  mr: 1.5,
                  px: 2.5,
                  borderRadius: `${theme.design.radius.control}`,
                  color: theme.design.color.textMuted,
                  fontSize: 15,
                  fontWeight: 700,
                  textTransform: "none",
                  "&.Mui-selected": {
                    bgcolor: "#fff",
                    color: "#000"
                  }
                }
              })}
            >
              {SEARCH_TABS.map((tab) => (
                <Tab key={tab.value} value={tab.value} label={tab.label} />
              ))}
            </Tabs>

            <Box sx={{ pt: { xs: 3, sm: 4 } }}>
              {loading && (
                <Typography color="text.secondary" fontWeight={600}>
                  Searching...
                </Typography>
              )}

              {!loading && !hasResults && (
                <Typography color="text.secondary" fontWeight={600}>
                  No results found
                </Typography>
              )}

              {!loading && hasResults && activeItems.length === 0 && (
                <Typography color="text.secondary" fontWeight={600}>
                  No {SEARCH_TABS.find((tab) => tab.value === activeTab)?.label.toLocaleLowerCase()}{" "}
                  found
                </Typography>
              )}

              {!loading &&
                hasResults &&
                activeItems.map((item) => <SearchResultRow key={item.id} item={item} dense />)}
            </Box>
          </>
        )}
      </Box>
    </PageScaffold>
  );
};
