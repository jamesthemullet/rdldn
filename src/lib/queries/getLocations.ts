const GET_LOCATIONS = `
  query {
    areas {
      nodes {
        name
        slug
      }
    }
    boroughs(first: 50) {
      nodes {
        name
        slug
      } 
    }
  }
`;

export default GET_LOCATIONS;
