export default (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
