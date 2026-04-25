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

export async function fetchGraphQL<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const cacheKey = getRequestCacheKey(query, variables);
  const existingRequest = graphQLRequestCache.get(cacheKey);

  if (existingRequest) {
    return (await existingRequest) as T;
  }

  const requestPromise = (async () => {
    const response = await fetch("https://blog.rdldn.co.uk/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
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

  graphQLRequestCache.set(cacheKey, requestPromise);

  try {
    return (await requestPromise) as T;
  } catch (error) {
    graphQLRequestCache.delete(cacheKey);
    throw error;
  }
}
