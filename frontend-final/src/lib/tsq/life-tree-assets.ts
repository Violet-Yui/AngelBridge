export type LifeTreeStage = "sprout" | "young" | "bloom";

export const LIFE_TREE_ASSETS: Record<LifeTreeStage, { src: string; alt: string }> = {
  sprout: {
    src: "/eazo-assets/life-tree-original-style-transparent.png",
    alt: "幼苗形态人生树",
  },
  young: {
    src: "/eazo-assets/life-tree-original-style-transparent.png",
    alt: "小树形态人生树",
  },
  bloom: {
    src: "/eazo-assets/life-tree-original-style-transparent.png",
    alt: "盛放形态人生树",
  },
};

export const CURRENT_LIFE_TREE_STAGE: LifeTreeStage = "bloom";
