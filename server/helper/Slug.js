export const createSlug = (text) => {
  if (!text) return "";

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove all non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and hyphens with a single dash
    .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
    .replace(/--+/g, "-"); // Replace multiple dashes with single dash
};
