const SINGLE_POST_QUERY = (slug: string) => `
  query SinglePost($id: ID = "${slug}") {
    post(idType: SLUG, id: $id) {
      postId
      date
      content
      title
      featuredImage {
        node {
          sourceUrl
        }
      }
      seo {
        opengraphTitle
        opengraphDescription
        opengraphSiteName
        opengraphImage {
          uri
          altText
          mediaDetails {
            file
            height
            width
          }
          mediaItemUrl
          sourceUrl
          srcSet
        }
      }
      areas {
        nodes {
          name
        }
      }
      boroughs {
        nodes {
          name
        }
      }
      tubeStations {
        nodes {
          name
        }
      }
      tubeLines {
        nodes {
          name
        }
      }
      prices {
        nodes {
          name
        }
      }
      ratings {
        nodes {
          name
        }
      }
      yearsOfVisit {
        nodes {
          name
        }
      }
      typesOfPost {
        nodes {
          name
        }
      }
      closedDowns {
        nodes {
          name
        }
      }
      nSFWs {
        nodes {
          name
        }
      }
      highlights {
        loathed
        loved
        website
        locationPost
        instagram
      }
      comments(where: { order: DESC }) {
        nodes {
          id
          content
          parentId
          author {
            node {
              name
            }
          }
          date
        }
      }
    }
  }
`;

export default SINGLE_POST_QUERY;
