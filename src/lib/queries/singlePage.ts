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
