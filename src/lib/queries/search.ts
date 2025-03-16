const SEARCH_QUERY = `
query SearchPosts($search: String!) {
  posts(where: { search: $search }, first: 4) {
    nodes {
      title
      slug
      excerpt
      date
      featuredImage {
        node {
          sourceUrl
        }
      }
    }
  }
}`;

export default SEARCH_QUERY;
