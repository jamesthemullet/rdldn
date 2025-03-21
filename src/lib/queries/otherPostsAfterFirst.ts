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
  }
`;

export default OTHER_POSTS_AFTER_FIRST_QUERY;
