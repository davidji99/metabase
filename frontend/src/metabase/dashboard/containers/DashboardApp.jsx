/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useState } from "react";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import _ from "underscore";

import { t } from "ttag";

import title from "metabase/hoc/Title";
import favicon from "metabase/hoc/Favicon";
import titleWithLoadingTime from "metabase/hoc/TitleWithLoadingTime";

import Dashboard from "metabase/dashboard/components/Dashboard/Dashboard";
import Toaster from "metabase/components/Toaster";

import { useLoadingTimer } from "metabase/hooks/use-loading-timer";
import { useWebNotification } from "metabase/hooks/use-web-notification";
import { useOnUnmount } from "metabase/hooks/use-on-unmount";

import Actions from "metabase/entities/actions";
import { fetchDatabaseMetadata } from "metabase/redux/metadata";
import { getIsNavbarOpen, setErrorPage } from "metabase/redux/app";
import MetabaseSettings from "metabase/lib/settings";

import {
  getIsEditing,
  getIsSharing,
  getDashboardBeforeEditing,
  getIsEditingParameter,
  getIsDirty,
  getDashboardComplete,
  getCardData,
  getSlowCards,
  getEditingParameter,
  getParameters,
  getParameterValues,
  getLoadingStartTime,
  getClickBehaviorSidebarDashcard,
  getIsAddParameterPopoverOpen,
  getSidebar,
  getShowAddQuestionSidebar,
  getFavicon,
  getDocumentTitle,
  getIsRunning,
  getIsLoadingComplete,
  getIsHeaderVisible,
  getIsAdditionalInfoVisible,

  // Writeback
  getFocusedEmitterId,
} from "../selectors";
import { getDatabases, getMetadata } from "metabase/selectors/metadata";
import {
  getUserIsAdmin,
  canManageSubscriptions,
} from "metabase/selectors/user";

import { getEmbedOptions } from "metabase/selectors/embed";

import * as dashboardActions from "../actions";
import { parseHashOptions } from "metabase/lib/browser";
import * as Urls from "metabase/lib/urls";

import Dashboards from "metabase/entities/dashboards";

import DataAppContext from "metabase/writeback/containers/DataAppContext";

import ActionParametersInputModal from "./ActionParametersInputModal";

const mapStateToProps = (state, props) => {
  return {
    dashboardId: props.dashboardId || Urls.extractEntityId(props.params.slug),

    canManageSubscriptions: canManageSubscriptions(state, props),
    isAdmin: getUserIsAdmin(state, props),
    isNavbarOpen: getIsNavbarOpen(state),
    isEditing: getIsEditing(state, props),
    isSharing: getIsSharing(state, props),
    dashboardBeforeEditing: getDashboardBeforeEditing(state, props),
    isEditingParameter: getIsEditingParameter(state, props),
    isDirty: getIsDirty(state, props),
    dashboard: getDashboardComplete(state, props),
    dashcardData: getCardData(state, props),
    slowCards: getSlowCards(state, props),
    databases: getDatabases(state, props),
    editingParameter: getEditingParameter(state, props),
    parameters: getParameters(state, props),
    parameterValues: getParameterValues(state, props),
    metadata: getMetadata(state),
    loadingStartTime: getLoadingStartTime(state),
    clickBehaviorSidebarDashcard: getClickBehaviorSidebarDashcard(state),
    isAddParameterPopoverOpen: getIsAddParameterPopoverOpen(state),
    sidebar: getSidebar(state),
    showAddQuestionSidebar: getShowAddQuestionSidebar(state),
    pageFavicon: getFavicon(state),
    documentTitle: getDocumentTitle(state),
    isRunning: getIsRunning(state),
    isLoadingComplete: getIsLoadingComplete(state),
    isHeaderVisible: getIsHeaderVisible(state),
    isAdditionalInfoVisible: getIsAdditionalInfoVisible(state),
    embedOptions: getEmbedOptions(state),

    // Writeback
    focusedEmitterId: getFocusedEmitterId(state),
  };
};

const mapDispatchToProps = {
  ...dashboardActions,
  archiveDashboard: id => Dashboards.actions.setArchived({ id }, true),
  fetchDatabaseMetadata,
  setErrorPage,
  onChangeLocation: push,
};

// NOTE: should use DashboardControls and DashboardData HoCs here?
const DashboardApp = props => {
  const options = parseHashOptions(window.location.hash);

  const { isRunning, isLoadingComplete, dashboard, focusedEmitterId } = props;

  const [editingOnLoad] = useState(options.edit);
  const [addCardOnLoad] = useState(options.add && parseInt(options.add));

  const [isShowingToaster, setIsShowingToaster] = useState(false);

  const onTimeout = useCallback(() => {
    if ("Notification" in window && Notification.permission === "default") {
      setIsShowingToaster(true);
    }
  }, []);

  useLoadingTimer(isRunning, {
    timer: 15000,
    onTimeout,
  });

  const [requestPermission, showNotification] = useWebNotification();

  useOnUnmount(props.reset);

  useEffect(() => {
    if (isLoadingComplete) {
      setIsShowingToaster(false);
      if (
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.hidden
      ) {
        showNotification(
          t`All Set! ${dashboard?.name} is ready.`,
          t`All questions loaded`,
        );
      }
    }
  }, [isLoadingComplete, showNotification, dashboard?.name]);

  const onConfirmToast = useCallback(async () => {
    await requestPermission();
    setIsShowingToaster(false);
  }, [requestPermission]);

  const onDismissToast = useCallback(() => {
    setIsShowingToaster(false);
  }, []);

  return (
    <DataAppContext>
      <div className="shrink-below-content-size full-height">
        <Dashboard
          editingOnLoad={editingOnLoad}
          addCardOnLoad={addCardOnLoad}
          {...props}
        />
        {/* For rendering modal urls */}
        {props.children}
        {dashboard && focusedEmitterId && (
          <ActionParametersInputModal
            dashboard={dashboard}
            focusedEmitterId={focusedEmitterId}
          />
        )}
        <Toaster
          message={t`Would you like to be notified when this dashboard is done loading?`}
          isShown={isShowingToaster}
          onDismiss={onDismissToast}
          onConfirm={onConfirmToast}
          fixed
        />
      </div>
    </DataAppContext>
  );
};

export default _.compose(
  ...[
    connect(mapStateToProps, mapDispatchToProps),
    favicon(({ pageFavicon }) => pageFavicon),
    title(({ dashboard, documentTitle }) => ({
      title: documentTitle || dashboard?.name,
      titleIndex: 1,
    })),
    titleWithLoadingTime("loadingStartTime"),
    MetabaseSettings.get("experimental-enable-actions") &&
      Actions.loadList({ metadataPropName: "actionListMetadata" }),
  ].filter(Boolean),
)(DashboardApp);
