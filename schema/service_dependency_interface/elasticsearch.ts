export interface ElasticSearch {
  id: string;
  options?: Options;
}
interface Options {
  [k: string]: unknown;
}