const GET_ALL_POST_LOCATIONS = `
  query GetPostsWithLocation($after: String) {
    posts(first: 100, after: $after) {
      nodes {
        id
        slug
        title
        location {
          latitude
          longitude
          title
        }
        closedDowns {
          nodes {
            name
          }
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
