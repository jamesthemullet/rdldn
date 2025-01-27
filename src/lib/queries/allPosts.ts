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
      }
    }
  }
`;

export default ALL_POSTS_QUERY;
