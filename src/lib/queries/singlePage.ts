const SINGLE_PAGE_QUERY_PREVIEW = `
  query SinglePage($id: ID!) {
    page(idType: DATABASE_ID, id: $id) {
      title
      slug
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
      seo {
        opengraphTitle
        opengraphDescription
        opengraphSiteName
        opengraphImage {
          uri
          altText
          mediaDetails {
            file
            height
            width
          }
          mediaItemUrl
          sourceUrl
          srcSet
        }
      }
    }
  }
`;

export default SINGLE_PAGE_QUERY_PREVIEW;
