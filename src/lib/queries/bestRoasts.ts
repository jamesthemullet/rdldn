const GET_BEST_ROASTS = `
  query {
    posts(first: 100, where: {tag: "best"}) {
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
        ratings {
          nodes {
            name
          }
        }
        yearsOfVisit {
          nodes {
            name
          }
        }
      }
    }
  }
 `;

export default GET_BEST_ROASTS;
