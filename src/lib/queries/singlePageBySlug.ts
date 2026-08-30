import { SEO_FIELDS } from "./fragments";

const SINGLE_PAGE_QUERY = (slug: string) => `
  query SinglePage($id: ID = "${slug}") {
    page(idType: URI, id: $id) {
      pageId
      date
      content
      title
      featuredImage {
        node {
          sourceUrl
        }
      }
      ${SEO_FIELDS}
      comments(where: { order: DESC }) {
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

export default SINGLE_PAGE_QUERY;
