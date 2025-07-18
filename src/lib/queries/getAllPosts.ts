const GET_ALL_POSTS = `
  query GetAllPosts($after: String) {
    posts(
      first: 100,
      after: $after
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        postId
        title
        date
        slug
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        ratings {
          nodes {
            name
          }
        }
        prices {
          nodes {
            name
          }
        }
        yearsOfVisit {
          nodes {
            name
          }
        }
        areas {
          nodes {
            name
          }
        }
        typesOfPost {
          nodes {
            name
          }
        }
        boroughs {
          nodes {
            name
          }
        }
        owners {
          nodes {
            name
          }
        }
        meats {
          nodes {
            name
          }
        }
        tubeStations {
          nodes {
            name
          }
        }
        closedDowns {
          nodes {
            name
          }
        }
        highlights {
          loved
          loathed
        }
        tags {
          nodes {
            name
          }
        }
      }
    }
  }
`;

export default GET_ALL_POSTS;
