'use strict';

/**
 * @ngdoc service
 * @name clientApp.items
 * @description
 * # items
 * Service in the clientApp.
 */
angular.module('clientApp')
  .service('Items', function ($q, $http, $timeout, Config, $rootScope, $log) {

    // A private cache key.
    var cache = {};

    var broadastUpdateEventName = 'gbItemsChanged';


    /**
     * Return the promise with the items list, from cache or the server.
     *
     * @param int companyId
     *   The company ID.
     *
     * @returns {*}
     */
    this.get = function(companyId) {
      if (cache && cache[companyId]) {
        return $q.when(cache[companyId].data);
      }

      return getDataFromBackend(companyId);
    };


    /**
     * Create a new item.
     *
     * @param data
     *   Object with data to be saved.
     */
    this.create= function(data) {
      var deferred = $q.defer();
      var url = Config.backend + '/api/items';

      $http({
        method: 'POST',
        url: url,
        data: data
      }).success(function(response) {
        // We don't need to query the backend again - we can simply append the
        // new items to the cached list.
        data = cache ? cache.data : [];
        data.unshift(response.data[0]);
        setCache(data.company, data);

        deferred.resolve(response.data[0]);
      });

      return deferred.promise;
    };

    /**
     * Return items array from the server.
     *
     * @param int companyId
     *   The company ID.
     *
     * @returns {$q.promise}
     */
    function getDataFromBackend(companyId) {
      var deferred = $q.defer();
      var url = Config.backend + '/api/items';
      var params = {
        sort: '-updated',
        'filter[company]': companyId
      };

      $http({
        method: 'GET',
        url: url,
        params: params
      }).success(function(response) {
        setCache(companyId, response.data);
        deferred.resolve(response.data);
      });

      return deferred.promise;
    };

    /**
     * Save cache, and broadcast en event to inform that the data changed.
     *
     * @param int companyId
     *   The company ID.
     * @param data
     *   Object with the data to cache.
     */
    var setCache = function(companyId, data) {
      // Cache data by company ID.
      cache[companyId] = {
        data: data,
        timestamp: new Date()
      };

      // Clear cache in 60 seconds.
      $timeout(function() {
        cache.data[companyId] = undefined;
      }, 60000);

      // Broadcast a change event.
      $rootScope.$broadcast(broadastUpdateEventName);
    }

  });
