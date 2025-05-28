const GET_ALL_POST_LOCATIONS = `
  query GetPostsWithLocation($after: String) {
    posts(first: 100, after: $after) {
      nodes {
        id
        title
        location {
          latitude
          longitude
          title
        }
        ratings {
          nodes {
            name
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export default GET_ALL_POST_LOCATIONS;
