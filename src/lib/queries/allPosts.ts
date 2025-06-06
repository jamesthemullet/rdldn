const ALL_POSTS_QUERY = `
  query AllPosts {
    posts {
      nodes {
        slug
        title
        customfields {
          rating
          currency
          price
          meat
          country
          yearVisited
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

export default ALL_POSTS_QUERY;
