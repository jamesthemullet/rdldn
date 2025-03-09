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
      pageInfo {
        endCursor
      }
    }
  }
`;

export default MOST_RECENT_POST_QUERY;
