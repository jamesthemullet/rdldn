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

export default GET_ALL_POSTS;
