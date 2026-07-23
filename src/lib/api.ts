const graphQLRequestCache = new Map<string, Promise<unknown>>();

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

// The WordPress backend occasionally returns transient 5xx responses (or an
// HTML maintenance page instead of JSON) during brief outages. These are
// worth retrying; a malformed query or a real GraphQL error is not.
class RetryableGraphQLError extends Error {}

const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchGraphQLOnce<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await fetch(import.meta.env.PUBLIC_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  let json: { data?: T; errors?: unknown };
  try {
    json = await response.json();
  } catch {
    throw new RetryableGraphQLError(
      `GraphQL Error: non-JSON response (status ${response.status})`
    );
  }

  if (!response.ok) {
    const errorMsg = `GraphQL Error: Unknown error. Response: ${JSON.stringify(json)}`;
    if (RETRYABLE_STATUSES.has(response.status)) {
      throw new RetryableGraphQLError(errorMsg);
    }
    throw new Error(errorMsg);
  }

  if (json.errors) {
    throw new Error(`GraphQL Error: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

async function fetchGraphQLWithRetry<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fetchGraphQLOnce<T>(query, variables);
    } catch (error) {
      const isLastAttempt = attempt === MAX_ATTEMPTS;
      if (!(error instanceof RetryableGraphQLError) || isLastAttempt) {
        throw error;
      }
      await delay(RETRY_DELAY_MS * attempt);
    }
  }

  // Unreachable: the loop always returns or throws.
  throw new Error("GraphQL Error: retry loop exhausted unexpectedly");
}

export async function fetchGraphQL<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const cacheKey = getRequestCacheKey(query, variables);
  const existingRequest = graphQLRequestCache.get(cacheKey);

  if (existingRequest) {
    return (await existingRequest) as T;
  }

  const requestPromise = fetchGraphQLWithRetry<T>(query, variables);

  graphQLRequestCache.set(cacheKey, requestPromise);

  try {
    return (await requestPromise) as T;
  } catch (error) {
    graphQLRequestCache.delete(cacheKey);
    throw error;
  }
}
