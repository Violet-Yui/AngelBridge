export { TsqApiError } from "./types";
export type * from "./types";
export {
  getHome,
  getMessageList,
  getRelationshipSettings,
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
  submitConversationReport,
  updateRelationshipSettings,
} from "./mock-api";

import { createPost, getHome, getMessageList, getRelationshipSettings, sendMessage, getDiscoverFeed, getDiscoverDetail, getThreadMessages, confirmBridge, getBridgeDetail, scheduleBridge, getTreeOverview, updateProfile, getResourceDetail, getNeedDetail, getSettings, getNotifications, sendXiaotianMessage, getXiaotianTask, retryXiaotianTask, submitConversationReport, updateRelationshipSettings } from "./mock-api";

export const tsqApi = {
  getHome,
  getMessageList,
  getRelationshipSettings,
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
  submitConversationReport, updateRelationshipSettings,
};
