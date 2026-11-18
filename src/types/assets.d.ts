/**
 * Next.js static image import declarations for CI typechecking.
 * These files are emitted as source objects by the Next.js image bundler.
 */
declare module "*.png" {
  const image: {
    src: string;
    width: number;
    height: number;
    blurDataURL?: string;
  };
  export default image;
}

declare module "*.svg" {
  const image: {
    src: string;
    width: number;
    height: number;
  };
  export default image;
}
