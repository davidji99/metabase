(ns metabase-enterprise.sandbox.api.dashboard-test
  "Tests for special behavior of `/api/metabase/dashboard` endpoints in the Metabase Enterprise Edition."
  (:require [clojure.test :refer :all]
            [metabase-enterprise.sandbox.test-util :as mt.tu]
            [metabase.api.dashboard-test :as api.dashboard-test]
            [metabase.models :refer [Card Dashboard DashboardCard FieldValues]]
            [metabase.test :as mt]
            [toucan.db :as db]))

(deftest params-values-test
  (testing "Don't return `param_values` for fields to which the user only has segmented access."
    (mt/with-gtaps {:gtaps      {:venues
                                 {:remappings {:cat [:variable [:field-id (mt/id :venues :category_id)]]}
                                  :query      (mt.tu/restricted-column-query (mt/id))}}
                    :attributes {:cat 50}}
      (mt/with-temp* [Dashboard     [{dashboard-id :id} {:name "Test Dashboard"}]
                      Card          [{card-id :id}      {:name "Dashboard Test Card"}]
                      DashboardCard [{_ :id}            {:dashboard_id       dashboard-id
                                                         :card_id            card-id
                                                         :parameter_mappings [{:card_id      card-id
                                                                               :parameter_id "foo"
                                                                               :target       [:dimension
                                                                                              [:field_id
                                                                                               (mt/id :venues :name)]]}]}]]
        (is (= nil
               (:param_values (mt/user-http-request :rasta :get 200 (str "dashboard/" dashboard-id)))))))))

(deftest chain-filter-sandboxed-field-values-test
  (testing "When chain filter endpoints would normally return cached FieldValues (#13832), make sure sandboxing is respected"
    (mt/with-temp-vals-in-db FieldValues (db/select-one-id FieldValues :field_id (mt/id :categories :name)) {:values ["Good" "Bad"]}
      (api.dashboard-test/with-chain-filter-fixtures [{:keys [dashboard]}]
        (mt/with-gtaps {:gtaps {:categories {:query (mt/mbql-query categories {:filter [:< $id 3]})}}}
          (testing "GET /api/dashboard/:id/params/:param-key/values"
            (api.dashboard-test/let-url [url (api.dashboard-test/chain-filter-values-url dashboard "_CATEGORY_NAME_")]
              (is (= ["African" "American"]
                     (take 2 (mt/user-http-request :rasta :get 200 url))))))
          (testing "GET /api/dashboard/:id/params/:param-key/search/:query"
            (api.dashboard-test/let-url [url (api.dashboard-test/chain-filter-search-url dashboard "_CATEGORY_NAME_" "ood")]
              (is (= ["Fast Food" "Food Truck" "Seafood"]
                     (mt/user-http-request :rasta :get 200 url))))))))))
