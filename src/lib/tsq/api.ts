export { TsqApiError } from "./types";
export type * from "./types";
export {
  getHome,
  getMessageList,
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

import { createPost, getHome, getMessageList, sendMessage, getDiscoverFeed, getDiscoverDetail, getThreadMessages, confirmBridge, getBridgeDetail, scheduleBridge, getTreeOverview, updateProfile, getResourceDetail, getNeedDetail, getSettings, getNotifications, sendXiaotianMessage, getXiaotianTask, retryXiaotianTask } from "./mock-api";

export const tsqApi = {
  getHome,
  getMessageList,
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
