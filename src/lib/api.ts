export async function fetchGraphQL(query: string, variables = {}) {
  const response = await fetch("https://blog.rdldn.co.uk/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(`GraphQL Error: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}
