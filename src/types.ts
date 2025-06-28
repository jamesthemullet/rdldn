export type Size = {
  name: string;
  sourceUrl: string;
};

export type Sizes = {
  name: string;
  sourceUrl: string;
}[];

export type Post = {
  title?: string;
  slug?: string;
  date: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
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
  };
  ratings?: {
    nodes: {
      name: string;
    }[];
  };
  yearsOfVisit?: {
    nodes: {
      name: string;
    }[];
  };
  location?: {
    latitude: string;
    longitude: string;
  };
  typesOfPost?: {
    nodes: {
      name: string;
    }[];
  };
  prices?: {
    nodes: {
      name: string;
    }[];
  };
  areas?: {
    nodes: {
      name: string;
    }[];
  };
  boroughs?: {
    nodes: {
      name: string;
    }[];
  };
  owners?: {
    nodes: {
      name: string;
    }[];
  };
  meats?: {
    nodes: {
      name: string;
    }[];
  };
  tubeStations?: {
    nodes: {
      name: string;
    }[];
  };
  closedDowns?: {
    nodes: {
      name: string;
    }[];
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
      avatar: {
        url: string;
      };
    };
  };
  date: string;
  content: {
    rendered: string;
  };
  replies?: Comment[];
  parentId?: string;
};

export type Comments = Comment[] | null;
