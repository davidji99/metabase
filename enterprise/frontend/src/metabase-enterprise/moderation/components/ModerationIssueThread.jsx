import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { t } from "ttag";

import {
  getOpenIssues,
  getColor,
  getModerationStatusIcon,
} from "metabase-enterprise/moderation";
import { MODERATION_TEXT } from "metabase-enterprise/moderation/constants";
import Button from "metabase/components/Button";
import Icon from "metabase/components/Icon";
import Comment from "metabase/components/Comment";

ModerationIssueThread.propTypes = {
  className: PropTypes.string,
  issue: PropTypes.object.isRequired,
  comments: PropTypes.array,
};

export function ModerationIssueThread({ className, issue, comments = [] }) {
  const color = getColor(issue.type);
  const icon = getModerationStatusIcon(issue.type);

  return (
    <div className={cx(className, "")}>
      <div className={`pb1 flex align-center text-${color} text-bold`}>
        <Icon name={icon} className="mr1" />
        {MODERATION_TEXT.user[issue.type].action}
      </div>
      <Comment
        title="foo"
        text={"bar bar bar\nbaz baz baz"}
        timestamp={Date.now()}
      />
      {comments.map(comment => {
        return <Comment key={comment.id} title="comment111" text="text111" />;
      })}
      <Button>{t`Comment`}</Button>
    </div>
  );
}
