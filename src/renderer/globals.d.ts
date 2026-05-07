import { AppApi } from "../preload";

declare global {
  interface Window {
    api: AppApi;
  }
}
