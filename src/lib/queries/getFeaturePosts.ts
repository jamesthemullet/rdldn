const GET_FEATURE_POSTS = `
  query {
    posts(where: {tag: "feature"}) {
      edges {
        node {
            id
          slug
          title
          featuredImage {
            node {
              sourceUrl
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
  }
`;

export default GET_FEATURE_POSTS;
