import type { Comment, Comments as CommentsType } from "../types";

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