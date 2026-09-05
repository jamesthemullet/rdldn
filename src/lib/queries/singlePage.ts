import { SEO_FIELDS } from "./fragments";

const SINGLE_PAGE_QUERY_PREVIEW = `
  query SinglePage($id: ID!) {
    page(idType: DATABASE_ID, id: $id) {
      title
      pageId
      slug
      content
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
      ${SEO_FIELDS}
      comments(where: { order: DESC }, first: 100) {
        nodes {
          id
          content
          parentId
          author {
            node {
              name
            }
          }
          date
        }
      }
    }
  }
`;

export default SINGLE_PAGE_QUERY_PREVIEW;
