const OTHER_POSTS_AFTER_FIRST_QUERY = `
  query GetOtherPosts($after: String) {
    posts(first: 13, after: $after) {
      nodes {
        id
        slug
        title
        date
        featuredImage {
          node {
            mediaDetails {
              sizes {
                sourceUrl
                name
              }
            }
          }
        }
      }
    }
  }
`;

export default OTHER_POSTS_AFTER_FIRST_QUERY;
