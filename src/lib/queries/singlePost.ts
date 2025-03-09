const SINGLE_POST_QUERY = `
  query SinglePost($id: ID!) {
    page(idType: DATABASE_ID, id: $id) {
      title
      content
      featuredImage {
        node {
          sourceUrl
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

export default SINGLE_POST_QUERY;
