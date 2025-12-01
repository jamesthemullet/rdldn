const GET_POSTS_BY_DATE = `
  query($year: Int!, $month: Int!) {
    posts(where: { dateQuery: { year: $year, month: $month } }) {
      nodes {
        id
        slug
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

export default GET_POSTS_BY_DATE;