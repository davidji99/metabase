import { getIn } from "icepick";
import {
  PLUGIN_MODERATION_COMPONENTS,
  PLUGIN_MODERATION_SERVICE,
} from "metabase/plugins";
import { ACTIONS } from "metabase-enterprise/moderation/constants";
import ModerationIssueActionMenu from "metabase-enterprise/moderation/components/ModerationIssueActionMenu";
import CreateModerationIssuePanel from "metabase-enterprise/moderation/components/CreateModerationIssuePanel";

Object.assign(PLUGIN_MODERATION_COMPONENTS, {
  ModerationIssueActionMenu,
  CreateModerationIssuePanel,
});

Object.assign(PLUGIN_MODERATION_SERVICE, {
  getModerationStatusIcon,
});

export function getModerationActionsList() {
  return [ACTIONS.verified, ACTIONS.misleading, ACTIONS.confused];
}

export function getModerationStatusIcon(type) {
  return getIn(ACTIONS, [type, "icon"]);
}

export function getColor(type) {
  return getIn(ACTIONS, [type, "color"]);
}
