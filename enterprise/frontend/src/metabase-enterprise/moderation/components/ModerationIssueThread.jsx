import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { t } from "ttag";

import {
  getColor,
  getModerationStatusIcon,
  getModerationRequestActionTypes,
} from "metabase-enterprise/moderation";
import { MODERATION_TEXT } from "metabase-enterprise/moderation/constants";
import Button from "metabase/components/Button";
import Icon from "metabase/components/Icon";
import Comment from "metabase/components/Comment";
import ModerationIssueActionMenu from "metabase-enterprise/moderation/components/ModerationIssueActionMenu";

ModerationIssueThread.propTypes = {
  className: PropTypes.string,
  issue: PropTypes.object.isRequired,
  onComment: PropTypes.func,
  onResolve: PropTypes.func,
};

export function ModerationIssueThread({
  className,
  issue,
  onComment,
  onResolve,
}) {
  const color = getColor(issue.type);
  const icon = getModerationStatusIcon(issue.type);
  const hasButtonBar = !!(onComment || onResolve);

  return (
    <div className={cx(className, "")}>
      <div className={`flex align-center text-${color} text-bold`}>
        <Icon name={icon} className="mr1" />
        {MODERATION_TEXT.user[issue.type].action}
      </div>
      <Comment
        className="pt1"
        title={issue.title}
        text={issue.text}
        timestamp={issue.timestamp}
        visibleLines={3}
      />
      {issue.comments.map(comment => {
        return (
          <Comment
            className="pt1"
            key={comment.id}
            title={comment.title}
            text={comment.text}
            timestamp={comment.timestamp}
          />
        );
      })}
      {hasButtonBar && (
        <div className="flex justify-end column-gap-1 pt1">
          {onComment && <Button onClick={onComment}>{t`Comment`}</Button>}
          {onResolve && (
            <ModerationIssueActionMenu
              triggerClassName="text-white text-white-hover bg-brand bg-brand-hover"
              onAction={onResolve}
              issue={issue}
            />
          )}
        </div>
      )}
    </div>
  );
}
