const SINGLE_PAGE_QUERY_PREVIEW = `
  query SinglePage($id: ID!) {
    page(idType: DATABASE_ID, id: $id) {
      title
      featuredImage {
        node {
          sourceUrl
          
        }
      }
    }
  }
`;

export default SINGLE_PAGE_QUERY_PREVIEW;
