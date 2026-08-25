const GET_YEARLY_STATS_POSTS = `
  query GetYearlyStatsPosts($after: String, $search: String) {
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
        title
        date
        slug
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
        meats {
          nodes {
            name
          }
        }
      }
    }
  }
`;

export default GET_YEARLY_STATS_POSTS;
