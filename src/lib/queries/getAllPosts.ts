const GET_ALL_POSTS = `
  query GetAllPosts($after: String, $search: String) {
    posts(
      first: 100,
      after: $after,
      where: {
        search: $search,
      }
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
        features {
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
        zones {
          nodes {
            name
          }
        }
        newSlugs {
          nodes {
            name
          }
        }
      }
    }
  }
`;

export default GET_ALL_POSTS;
