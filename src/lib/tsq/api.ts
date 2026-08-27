export { TsqApiError } from "./types";
export type * from "./types";
export {
  createPost,
  sendMessage,
  getDiscoverFeed,
  getDiscoverDetail,
  getThreadMessages,
  confirmBridge,
  getBridgeDetail,
  scheduleBridge,
  getTreeOverview,
  updateProfile,
  getResourceDetail, getNeedDetail, getSettings, getNotifications,
  sendXiaotianMessage,
  getXiaotianTask,
  retryXiaotianTask,
} from "./mock-api";

import { createPost, sendMessage, getDiscoverFeed, getDiscoverDetail, getThreadMessages, confirmBridge, getBridgeDetail, scheduleBridge, getTreeOverview, updateProfile, getResourceDetail, getNeedDetail, getSettings, getNotifications, sendXiaotianMessage, getXiaotianTask, retryXiaotianTask } from "./mock-api";

export const tsqApi = {
  createPost,
  getDiscoverFeed,
  sendMessage,
  getDiscoverDetail,
  getThreadMessages,
  confirmBridge,
  getBridgeDetail,
  scheduleBridge,
  getTreeOverview,
  updateProfile,
  getResourceDetail, getNeedDetail, getSettings, getNotifications, sendXiaotianMessage,
  getXiaotianTask, retryXiaotianTask,
};
