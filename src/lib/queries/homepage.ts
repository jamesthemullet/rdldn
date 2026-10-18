const FEATURED_IMAGE_FIELDS = `
  featuredImage {
    node {
      sourceUrl
      mediaDetails {
        sizes {
          sourceUrl
          name
        }
      }
    }
  }
`;

export const HOMEPAGE_LATEST_POSTS_QUERY = `
  query HomepageLatestPosts {
    posts(first: 4) {
      nodes {
        id
        slug
        title
        date
        ${FEATURED_IMAGE_FIELDS}
        seo {
          opengraphImage {
            sourceUrl
          }
        }
      }
    }
  }
`;

// Fetches several pages by database ID in a single request using aliases
// (p5614: page(...)), selecting only what a homepage card needs.
export const buildHomepagePagesQuery = (ids: string[]): string => `
  query HomepagePages {
    ${ids
      .map(
        (id) => `p${id}: page(idType: DATABASE_ID, id: "${id}") {
      slug
      title
      ${FEATURED_IMAGE_FIELDS}
    }`
      )
      .join("\n")}
  }
`;
