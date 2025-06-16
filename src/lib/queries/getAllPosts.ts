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
          yearsOfVisit {
            nodes {
              name
            }
}typesOfPost {
        nodes {
          name
        }
}}
        }
      }
`;

export default GET_ALL_POSTS;
