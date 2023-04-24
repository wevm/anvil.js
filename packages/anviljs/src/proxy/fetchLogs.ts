export async function fetchLogs(url: string, id: number): Promise<string[]> {
  const response = await fetch(new URL(`${id}/logs`, url), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.json();
}
