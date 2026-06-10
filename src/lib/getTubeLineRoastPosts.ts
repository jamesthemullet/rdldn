import type { Post } from "../types";
import { getAllRoastDinnerPosts } from "./getAllRoastDinnerPosts";
import { getPostRating } from "./utils";

export async function getTubeLineRoastPosts(
  tubeStations: string[],
  minimumRating = 7.5,
): Promise<Post[]> {
  const allPosts = await getAllRoastDinnerPosts();

  return allPosts.filter((post) => {
    const rating = getPostRating(post);

    return (
      rating >= minimumRating &&
      post.tubeStations?.nodes.some((station) => tubeStations.includes(station.name)) &&
      post.closedDowns?.nodes.length === 0
    );
  });
}
