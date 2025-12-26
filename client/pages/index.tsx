import React from 'react'

function IndexPage() {

  const [message, setMessage] = React.useState("");
  const [people, setPeople] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setError(null);
        setLoading(true);

        const response = await fetch("/api/home", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }

        const data: { message: string; people: string[] } = await response.json();
        setMessage(data.message ?? "");
        setPeople(Array.isArray(data.people) ? data.people : []);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [])

  return (
    <div>
      {loading ? <div>Loading…</div> : null}
      {error ? <div>Error: {error}</div> : null}
      {!loading && !error ? <div>{message}</div> : null}
      {
        people.map((person, index) => (
          <div key={index}>{person}</div>
        ))
      }
    </div>
  )
}

export default IndexPage
