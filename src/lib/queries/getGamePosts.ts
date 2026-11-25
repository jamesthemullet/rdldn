// Only the fields the Guess The Score game uses. The page renders on every request, so the
// full GET_ALL_POSTS query (every taxonomy, ~11s across all pages) is too slow for it.
// Keep this formatted: the blog's firewall rejects some minified query bodies with a 403.
const GET_GAME_POSTS = `
  query GetGamePosts($after: String) {
    posts(first: 100, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        title
        slug
        featuredImage {
          node {
            sourceUrl
          }
        }
        ratings {
          nodes {
            name
          }
        }
      }
    }
  }
`;

export default GET_GAME_POSTS;
