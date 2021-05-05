(ns metabase-enterprise.sandbox.models.params.field-values
  (:require [clojure.core.memoize :as memoize]
            [metabase-enterprise.enhancements.ee-strategy-impl :as ee-strategy-impl]
            [metabase-enterprise.sandbox.api.table :as sandbox.api.table]
            [metabase.api.common :as api]
            [metabase.models.field :as field]
            [metabase.models.field-values :as field-values :refer [FieldValues]]
            [metabase.models.params.field-values :as params.field-values]
            [metabase.util :as u]
            [pretty.core :as pretty]
            [toucan.db :as db]))

(def ^:private ^{:arglist '([user-id last-updated field])} fetch-sandboxed-field-values*
  (memoize/ttl
   (fn [_ _ field]
     {:values   (map vector (field-values/distinct-values field))
      :field_id (u/the-id field)})
   ;; Expire entires older than 30 days so we don't have entries for users and/or fields that
   ;; no longer exists hanging around.
   ;; (`clojure.core.cache/TTLCacheQ` (which `memoize` uses underneath) evicts all stale entries on
   ;; every cache miss)
   :ttl/threshold (* 1000 60 60 24 30)))

(defn- fetch-sandboxed-field-values
  [field]
  (fetch-sandboxed-field-values*
   api/*current-user-id*
   (db/select-one-field :updated_at FieldValues :field_id (u/the-id field))
   field))

(def ^:private impl
  (reify
    pretty/PrettyPrintable
    (pretty [_]
      `impl)

    params.field-values/FieldValuesForCurrentUser
    (current-user-can-fetch-field-values?* [_ field]
      (or (sandbox.api.table/only-segmented-perms? (field/table field))
          (params.field-values/current-user-can-fetch-field-values?* params.field-values/default-impl field)))

    (field-values-for-current-user* [_ field]
      (if (sandbox.api.table/only-segmented-perms? (field/table field))
        (fetch-sandboxed-field-values field)
        (params.field-values/field-values-for-current-user* params.field-values/default-impl field)))))

(def ee-strategy-impl
  "Enterprise version of the fetch FieldValues for current User logic. Uses our EE strategy pattern adapter: if EE
  features *are* enabled, forwards method invocations to `impl`; if EE features *are not* enabled, forwards method
  invocations to the default OSS impl."
  (ee-strategy-impl/reify-ee-strategy-impl impl params.field-values/default-impl
    params.field-values/FieldValuesForCurrentUser))
