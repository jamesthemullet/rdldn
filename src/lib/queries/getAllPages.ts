const GET_ALL_PAGES = `
  query {
    pages(first: 100) {
      nodes {
        id
        title
        slug
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
        highlights {
          tag
        }
      }
    }
  }
`;

export default GET_ALL_PAGES;
