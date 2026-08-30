import { SEO_FIELDS } from "./fragments";

const OTHER_POSTS_AFTER_FIRST_QUERY = `
  query GetOtherPosts($after: String) {
    posts(first: 3, after: $after) {
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
        ${SEO_FIELDS}
      }
    }
  }
`;

export default OTHER_POSTS_AFTER_FIRST_QUERY;
