// The one line to change when swapping companion renderers. The video renderer
// plays Google Flow clips where they exist and falls back to the still PNG art
// (Safari, reduced motion, stages without clips). A future Rive/Live2D rig
// would replace it here.
export { VideoCompanionRenderer as ActiveCompanionRenderer } from "./VideoCompanionRenderer";
