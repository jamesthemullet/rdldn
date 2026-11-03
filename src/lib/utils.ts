import type { Comment, Comments as CommentsType, Post } from "../types";

type TopRoastPostOptions = {
  lovedIncludesAny?: string[];
  lovedExcludes?: string[];
  extraPredicate?: (post: Post) => boolean;
  limit?: number;
};

export const getPostRating = (post: Post): number =>
  Number.parseFloat(post.ratings?.nodes?.[0]?.name || "0");

export const isRoastDinnerPost = (post: Post): boolean =>
  post.typesOfPost?.nodes?.some((node) => node.name === "Roast Dinner") ?? false;

export const isClosedDownPost = (post: Post): boolean =>
  (post.closedDowns?.nodes?.length ?? 0) > 0;

export const getTopRoastDinnerPosts = (
  posts: Post[],
  {
    lovedIncludesAny = [],
    lovedExcludes = [],
    extraPredicate,
    limit = 5
  }: TopRoastPostOptions = {}
): Post[] => {
  const includes = lovedIncludesAny.map((term) => term.toLowerCase());
  const excludes = lovedExcludes.map((term) => term.toLowerCase());

  return posts
    .filter((post) => {
      const loved = post.highlights?.loved?.toLowerCase() ?? "";
      const rating = getPostRating(post);

      if (Number.isNaN(rating) || isClosedDownPost(post) || !isRoastDinnerPost(post)) {
        return false;
      }

      if (includes.length > 0 && !includes.some((term) => loved.includes(term))) {
        return false;
      }

      if (excludes.some((term) => loved.includes(term))) {
        return false;
      }

      if (extraPredicate && !extraPredicate(post)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => getPostRating(b) - getPostRating(a))
    .slice(0, limit);
};

// Best-of pages show up to 10 roasts while they're all rated 8+, but never fewer than the original 5.
const BEST_OF_MAX = 10;
const BEST_OF_MIN = 5;
const BEST_OF_HIGH_RATING = 8;

export const getBestOfRoastDinnerPosts = (
  posts: Post[],
  options: Omit<TopRoastPostOptions, "limit"> = {}
): Post[] => {
  const ranked = getTopRoastDinnerPosts(posts, { ...options, limit: BEST_OF_MAX });
  const highlyRated = ranked.filter((post) => getPostRating(post) >= BEST_OF_HIGH_RATING).length;
  return ranked.slice(0, Math.max(BEST_OF_MIN, highlyRated));
};

export const organiseComments = (comments: CommentsType): Comment[] => {
  if (!comments || comments.length === 0) {
    return [];
  }

  const commentMap = new Map<string, Comment>();

  comments.forEach((comment) => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  const topLevelComments: Comment[] = [];

  comments.forEach((comment) => {
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies?.push(comment);
        return;
      }
    }

    topLevelComments.push(comment);
  });

  return topLevelComments;
};