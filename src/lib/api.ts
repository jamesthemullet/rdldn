// Short-lived cache: dedupes identical requests within a render and across requests on a
// warm serverless instance, but expires so new content (or a recovered backend) shows up.
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20 * 1000;

const graphQLRequestCache = new Map<string, { promise: Promise<unknown>; expiresAt: number }>();

export function resetGraphQLRequestCache(): void {
  graphQLRequestCache.clear();
}

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`);
  return `{${entries.join(",")}}`;
};

const getRequestCacheKey = (
  query: string,
  variables: Record<string, unknown>
): string => `${query}::${stableStringify(variables)}`;

export async function fetchGraphQL<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const cacheKey = getRequestCacheKey(query, variables);
  const existingRequest = graphQLRequestCache.get(cacheKey);

  if (existingRequest && existingRequest.expiresAt > Date.now()) {
    return (await existingRequest.promise) as T;
  }

  const requestPromise = (async () => {
    const response = await fetch(import.meta.env.PUBLIC_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const json = await response.json();

    if (!response.ok || json.errors) {
      const errorMsg = json.errors
        ? `GraphQL Error: ${JSON.stringify(json.errors)}`
        : `GraphQL Error: Unknown error. Response: ${JSON.stringify(json)}`;
      throw new Error(errorMsg);
    }

    return json.data;
  })();

  const entry = { promise: requestPromise, expiresAt: Date.now() + CACHE_TTL_MS };
  graphQLRequestCache.set(cacheKey, entry);

  try {
    return (await requestPromise) as T;
  } catch (error) {
    if (graphQLRequestCache.get(cacheKey) === entry) {
      graphQLRequestCache.delete(cacheKey);
    }
    throw error;
  }
}
