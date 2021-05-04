import React from "react";
import PropTypes from "prop-types";
import { t } from "ttag";
import cx from "classnames";

import {
  getOpenIssues,
  getColor,
  getModerationStatusIcon,
} from "metabase-enterprise/moderation";
import { MODERATION_TEXT } from "metabase-enterprise/moderation/constants";
import Button from "metabase/components/Button";
import Icon from "metabase/components/Icon";
import { ModerationIssueThread } from "metabase-enterprise/moderation/components/ModerationIssueThread";

OpenModerationIssuesPanel.propTypes = {
  onReturn: PropTypes.func.isRequired,
};

// className,
// title,
// timestamp,
// text,
// visibleLines,
// actions = []

export function OpenModerationIssuesPanel({ onReturn }) {
  const issues = getOpenIssues();
  return (
    <div className="px1">
      <div className="py1 border-row-divider">
        <Button
          className="text-brand text-brand-hover"
          borderless
          icon="chevronleft"
          onClick={onReturn}
        >{t`Open issues`}</Button>
      </div>
      <div className="px2">
        {issues.map(issue => {
          return (
            <ModerationIssueThread
              key={issue.id}
              className="py2 border-row-divider"
              issue={issue}
            />
          );
        })}
      </div>
    </div>
  );
}
