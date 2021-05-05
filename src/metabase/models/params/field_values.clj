(ns metabase.models.params.field-values
  "Code related to fetching *cached* FieldValues for Fields to populate parameter widgets. Always used by the field
  values (`GET /api/field/:id/values`) endpoint; used by the chain filter endpoints under certain circumstances."
  (:require [clojure.tools.logging :as log]
            [metabase.models.field-values :as field-values]
            [metabase.models.interface :as mi]
            [metabase.plugins.classloader :as classloader]
            [metabase.util :as u]
            [potemkin :as p]
            [pretty.core :as pretty]))

(p/defprotocol+ FieldValuesForCurrentUser
  "Protocol for fetching FieldValues for a Field for the current User. There are different implementations for EE and
  OSS."
  (current-user-can-fetch-field-values?* [impl field]
    "Whether the current User has permissions to fetch FieldValues for a `field`.")

  (field-values-for-current-user* [impl field]
    "Fetch the cached FieldValues for a `field`. These should be filtered as appropriate for the current
 User (currently this only applies to the EE impl). If the Field has a human-readable values remapping (see
 documentation at the top of `metabase.models.params.chain-filter` for an explanation of what this means), the format
 of the map should be:

    {:values   [[original-value human-readable-value]]
     :field_id field-id}

 If the Field does *not* have human-readable values remapping, the format of the map should be:

    {:values   [[value]]
     :field_id field-id}"))

(defn- default-field-values-for-current-user* [field]
  (if-let [field-values (and (field-values/field-should-have-field-values? field)
                             (field-values/create-field-values-if-needed! field))]
    (-> field-values
        (assoc :values (field-values/field-values->pairs field-values))
        (dissoc :human_readable_values :created_at :updated_at :id))
    {:values [], :field_id (:id field)}))

(def default-impl
  "Default (OSS) impl of the `FieldValuesForCurrentUser` protocol. Does not do anything special if sandboxing is in effect."
  (reify
    pretty/PrettyPrintable
    (pretty [_]
      `impl)

    FieldValuesForCurrentUser
    (current-user-can-fetch-field-values?* [_ field]
      (mi/can-read? field))

    (field-values-for-current-user* [_ field]
      (default-field-values-for-current-user* field))))

(def ^:private impl
  ;; if EE impl is present, use it. It implements the strategy pattern and will forward method invocations to the
  ;; default OSS impl if we don't have a valid EE token. Thus the actual EE versions of the methods won't get used
  ;; unless EE code is present *and* we have a valid EE token.
  (delay
    (u/prog1 (or (u/ignore-exceptions
                   (classloader/require 'metabase-enterprise.sandbox.models.params.field-values)
                   (some-> (resolve 'metabase-enterprise.sandbox.models.params.field-values/ee-strategy-impl) var-get))
                 default-impl)
      (log/debugf "FieldValuesForCurrentUser implementation set to %s" <>))))

(defn current-user-can-fetch-field-values? [field]
  (current-user-can-fetch-field-values?* @impl field))

(defn field-values-for-current-user [field]
  (field-values-for-current-user* @impl field))
