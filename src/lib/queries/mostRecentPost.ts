import { SEO_FIELDS } from "./fragments";

const MOST_RECENT_POST_QUERY = `
  query GetMostRecentPost {
    posts(first: 1) {
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
      pageInfo {
        endCursor
      }
    }
  }
`;

export default MOST_RECENT_POST_QUERY;
