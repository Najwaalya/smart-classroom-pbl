import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json());

export function useAnalytics() {

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR(
    "/api/analytics",
    fetcher,
    {
      refreshInterval: 5000,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}