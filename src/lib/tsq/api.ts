export { TsqApiError } from "./types";
export type * from "./types";
export {
  getHome,
  getGrowthLog,
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
  getResourceDetail, getNeedDetail, getSettings, updateSettings, getNotifications,
  sendXiaotianMessage,
  getXiaotianTask,
  retryXiaotianTask,
  submitConversationReport,
  updateRelationshipSettings,
} from "./mock-api";

import { createPost, getHome, getGrowthLog, getMessageList, getRelationshipSettings, sendMessage, getDiscoverFeed, getDiscoverDetail, getThreadMessages, confirmBridge, getBridgeDetail, scheduleBridge, getTreeOverview, updateProfile, getResourceDetail, getNeedDetail, getSettings, updateSettings, getNotifications, sendXiaotianMessage, getXiaotianTask, retryXiaotianTask, submitConversationReport, updateRelationshipSettings } from "./mock-api";

export const tsqApi = {
  getHome,
  getGrowthLog,
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
  getResourceDetail, getNeedDetail, getSettings, updateSettings, getNotifications, sendXiaotianMessage,
  getXiaotianTask, retryXiaotianTask,
  submitConversationReport, updateRelationshipSettings,
};
