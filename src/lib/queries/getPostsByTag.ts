const GET_POSTS_BY_TAG = `
  query($tag: String!) {
    posts(first: 100, where: { tag: $tag }) {
      nodes {
        id
        slug
        title
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
        ratings {
          nodes {
            name
          }
        }
        yearsOfVisit {
          nodes {
            name
          }
        }
        closedDowns {
          nodes {
            name
          }
        }
      }
    }
  }
`;

export default GET_POSTS_BY_TAG;
