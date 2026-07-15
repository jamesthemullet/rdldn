export type Size = {
  name: string;
  sourceUrl: string;
};

export type Sizes = {
  name: string;
  sourceUrl: string;
}[];

export type NameNode = {
  name: string;
};

export type NamedTaxonomy = {
  nodes: NameNode[];
};

export type Post = {
  postId?: number;
  title?: string;
  slug?: string;
  date: string;
  content?: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText?: string;
      mediaDetails?: {
        sizes: Sizes;
      };
    };
  };
  featuredImageUrl?: string;
  seo?: {
    opengraphImage?: {
      sourceUrl: string;
    };
    opengraphDescription?: string;
    opengraphTitle?: string;
  };
  comments?: {
    nodes: Comment[];
  };
  ratings?: NamedTaxonomy;
  yearsOfVisit?: NamedTaxonomy;
  location?: {
    latitude: string;
    longitude: string;
  };
  typesOfPost?: NamedTaxonomy;
  prices?: NamedTaxonomy;
  areas?: NamedTaxonomy;
  boroughs?: NamedTaxonomy;
  owners?: NamedTaxonomy;
  meats?: NamedTaxonomy;
  tubeStations?: NamedTaxonomy;
  tubeLines?: NamedTaxonomy;
  nSFWs?: NamedTaxonomy;
  closedDowns?: NamedTaxonomy;
  features?: NamedTaxonomy;
  highlights?: {
    loved: string;
    loathed: string;
    website?: string;
    locationPost?: string;
    instagram?: string;
  };
  tags?: NamedTaxonomy;
  zones?: NamedTaxonomy;
  newSlugs?: NamedTaxonomy;
};

export type PostsConnection = {
  nodes: Post[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
};

export type Location = {
  name: string;
  slug: string;
};

export type Page = {
  id: string;
  pageId: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: {
    node: {
      sourceUrl: string;
      mediaDetails?: {
        sizes: Sizes;
      };
    };
  };
  featuredImageUrl: string;
  highlights?: {
    tag: string;
  };
  comments: {
    nodes: Comment[];
  };
  seo?: {
    opengraphImage: {
      sourceUrl: string;
    };
    opengraphDescription?: string;
    opengraphTitle?: string;
  };
};

export type Comment = {
  id: string;
  author: {
    node: {
      name: string;
      avatar?: {
        url: string;
      };
    };
  };
  date: string;
  content: string;
  replies?: Comment[];
  parentId?: string;
};

export type Comments = Comment[] | null;
