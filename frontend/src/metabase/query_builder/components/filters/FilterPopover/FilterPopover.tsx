import React, { useState, useEffect } from "react";
import { t } from "ttag";

import { usePrevious } from "metabase/hooks/use-previous";

import { color } from "metabase/lib/colors";
import Filter from "metabase-lib/lib/queries/structured/Filter";
import StructuredQuery from "metabase-lib/lib/queries/StructuredQuery";
import { FieldDimension } from "metabase-lib/lib/Dimension";
import { isStartingFrom } from "metabase/lib/query_time";

import Icon from "metabase/components/Icon";
import ExpressionPopover from "metabase/query_builder/components/ExpressionPopover";
import SidebarHeader from "metabase/query_builder/components/SidebarHeader";

import FilterPopoverHeader from "./FilterPopoverHeader";
import FilterPopoverPicker from "./FilterPopoverPicker";
import FilterPopoverFooter from "./FilterPopoverFooter";
import { Button } from "./FilterPopover.styled";
import DatePicker from "../pickers/DatePicker/DatePicker";
import TimePicker from "../pickers/TimePicker";
import { DateShortcutOptions } from "../pickers/DatePicker/DatePickerShortcutOptions";
import DimensionList from "../../DimensionList";

const MIN_WIDTH = 300;
const MAX_WIDTH = 410;

const CUSTOM_SECTION_NAME = t`Custom Expression`;

type Props = {
  className?: string;
  style?: React.CSSProperties;
  fieldPickerTitle?: string;
  filter: Filter;
  query: StructuredQuery;
  onChange?: (filter: Filter) => void;
  onChangeFilter: (filter: Filter) => void;

  onClose?: () => void;

  noCommitButton?: boolean;
  showFieldPicker?: boolean;
  showOperatorSelector?: boolean;
  dateShortcutOptions?: DateShortcutOptions;
  showCustom?: boolean;
  isNew?: boolean;
  isTopLevel?: boolean;
  checkedColor?: string;
};

type State = {
  filter: Filter | null;
  choosingField: boolean;
  editingFilter: boolean;
};

export default function FilterPopover({
  isNew: isNewProp,
  filter: filterProp,
  style = {},
  showFieldPicker = true,
  showCustom = true,
  noCommitButton,
  className,
  query,
  showOperatorSelector,
  fieldPickerTitle,
  isTopLevel,
  dateShortcutOptions,
  checkedColor,
  onChange,
  onChangeFilter,
  onClose,
}: Props) {
  const [filter, setFilter] = useState(
    filterProp instanceof Filter ? filterProp : null,
  );
  const [choosingField, setChoosingField] = useState(!filter);
  const [editingFilter, setEditingFilter] = useState(
    !!(filter?.isCustom() && !isStartingFrom(filter)),
  );

  const previousQuery = usePrevious(query);

  // if the underlying query changes (e.x. additional metadata is loaded) update the filter's query
  useEffect(() => {
    if (filter && previousQuery && query !== previousQuery) {
      setFilter(filter.setQuery(query));
    }
  }, [query, previousQuery, filter]);

  useEffect(() => {
    if (typeof onChange === "function" && filter && filter !== filterProp) {
      onChange(filter);
    }
  }, [filter, onChange, filterProp]);

  // we should only commit the filter once to prevent
  // inconsistent filters from being committed
  const handleCommitFilter = (
    newFilter: Filter | null,
    query: StructuredQuery,
  ) => {
    if (newFilter && !(newFilter instanceof Filter)) {
      newFilter = new Filter(newFilter, null, query);
    }
    if (newFilter && newFilter.isValid() && onChangeFilter) {
      onChangeFilter(newFilter);
      if (typeof onClose === "function") {
        onClose();
      }
    }
  };

  const handleUpdateAndCommit = (newFilterMbql: any[]) => {
    const base = filter || new Filter([], null, query);
    const newFilter = base.set(newFilterMbql) as Filter;

    setFilter(newFilter);
    handleCommitFilter(newFilter, query);
  };

  const handleCommit = (newFilterMbql?: any[]) => {
    handleCommitFilter(
      newFilterMbql ? filter?.set(newFilterMbql) : filter,
      query,
    );
  };

  const handleDimensionChange = (dimension: FieldDimension) => {
    const field = dimension?.field();
    const newFilter =
      !filter || filter.query() !== dimension.query() || field?.isDate?.()
        ? new Filter(
            [],
            null,
            dimension.query() || (filter && filter.query()) || query,
          )
        : filter;

    setFilter(
      newFilter.setDimension(dimension.mbql(), { useDefaultOperator: true }),
    );

    setChoosingField(false);
  };

  const handleFilterChange = (mbql: any[] = []) => {
    const newFilter = new Filter(mbql, filter?.index(), query);

    setFilter(newFilter);
  };

  if (editingFilter) {
    return (
      <ExpressionPopover
        title={CUSTOM_SECTION_NAME}
        query={query}
        expression={filter ? filter.raw() : null}
        startRule="boolean"
        isValid={filter && filter.isValid()}
        onChange={handleFilterChange}
        onDone={handleUpdateAndCommit}
        onBack={() => setEditingFilter(false)}
      />
    );
  }

  const dimension = filter && filter.dimension();
  if (!filter || choosingField || !dimension) {
    return (
      <div
        className={className}
        style={{ minWidth: MIN_WIDTH, overflowY: "auto", ...style }}
      >
        {fieldPickerTitle && (
          <SidebarHeader className="mx1 my2" title={fieldPickerTitle} />
        )}
        <DimensionList
          style={{ color: color("filter") }}
          maxHeight={Infinity}
          dimension={dimension}
          sections={
            isTopLevel
              ? query.topLevelFilterFieldOptionSections()
              : ((filter && filter.query()) || query).filterFieldOptionSections(
                  filter,
                  {
                    includeSegments: showCustom,
                  },
                )
          }
          onChangeDimension={(dimension: FieldDimension) =>
            handleDimensionChange(dimension)
          }
          onChangeOther={(item: { filter: Filter; query: StructuredQuery }) => {
            // special case for segments
            handleCommitFilter(item.filter, item.query);
          }}
          width="100%"
          alwaysExpanded={isTopLevel}
        />
        {showCustom && (
          <div
            style={{ color: color("filter") }}
            className="List-section List-section--togglable"
            onClick={() => setEditingFilter(true)}
          >
            <div className="List-section-header mx2 py2 flex align-center hover-parent hover--opacity cursor-pointer">
              <span className="List-section-icon mr1 flex align-center">
                <Icon name="filter" />
              </span>
              <h3 className="List-section-title text-wrap">
                {CUSTOM_SECTION_NAME}
              </h3>
            </div>
          </div>
        )}
      </div>
    );
  }

  const field = dimension.field();
  const isNew = isNewProp || !filterProp?.operator();
  const primaryColor = color("brand");
  const onBack = () => {
    setChoosingField(true);
  };

  const shouldShowDatePicker = field?.isDate() && !field?.isTime();
  const supportsExpressions = query.database()?.supportsExpressions();

  return (
    <div className={className} style={{ minWidth: MIN_WIDTH, ...style }}>
      {shouldShowDatePicker ? (
        <DatePicker
          className={className}
          filter={filter}
          dateShortcutOptions={dateShortcutOptions}
          primaryColor={primaryColor}
          minWidth={MIN_WIDTH}
          maxWidth={MAX_WIDTH}
          onBack={onBack}
          onCommit={handleCommit}
          onFilterChange={handleFilterChange}
          disableChangingDimension={!showFieldPicker}
          supportsExpressions={supportsExpressions}
        >
          <Button
            data-ui-tag="add-filter"
            primaryColor={primaryColor}
            disabled={!filter.isValid()}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ml="auto"
            onClick={() => handleCommit()}
          >
            {isNew ? t`Add filter` : t`Update filter`}
          </Button>
        </DatePicker>
      ) : (
        <div>
          {field?.isTime() ? (
            <TimePicker
              className={className}
              filter={filter}
              primaryColor={primaryColor}
              minWidth={MIN_WIDTH}
              maxWidth={MAX_WIDTH}
              onBack={onBack}
              onCommit={handleCommit}
              onFilterChange={handleFilterChange}
            />
          ) : (
            <>
              <FilterPopoverHeader
                filter={filter}
                onFilterChange={handleFilterChange}
                onBack={onBack}
                showFieldPicker={showFieldPicker}
                forceShowOperatorSelector={showOperatorSelector}
              />
              <FilterPopoverPicker
                className="px1 pt1 pb1"
                filter={filter}
                onFilterChange={handleFilterChange}
                onCommit={handleCommit}
                maxWidth={MAX_WIDTH}
                primaryColor={primaryColor}
                checkedColor={checkedColor}
              />
            </>
          )}
          <FilterPopoverFooter
            className="px1 pb1"
            filter={filter}
            onFilterChange={handleFilterChange}
            onCommit={!noCommitButton ? handleCommit : null}
            isNew={!!isNew}
          />
        </div>
      )}
    </div>
  );
}
