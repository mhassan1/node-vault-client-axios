'use strict';

const axios = require('axios');
const urljoin = require('url-join');
const _ = require('lodash');

const errors = require('./errors')

class VaultApiClient {

    /**
     * @param {Object} config
     * @param {String} config.url - the url of the vault server
     * @param {String} [config.apiVersion='v1']
     * @param {Object} logger
     */
    constructor(config, logger) {
        this.__config = _.defaultsDeep(_.cloneDeep(config), {
            apiVersion: 'v1',
        });

        this._logger = logger;
    }

    makeRequest(method, path, data, headers) {
        data = data === undefined ? null : data;
        headers = headers === undefined ? {} : headers;

        const requestOptions = {
            method: method,
            data: data === null ? undefined : data,
            url: urljoin(this.__config.url, this.__config.apiVersion, path),
            headers,
        };

        this._logger.debug(
            'making request: %s %s',
            requestOptions.method,
            requestOptions.url
        );

        return axios.request(requestOptions)
            .then((response) => {
                this._logger.debug('%s %s response body:\n%s',
                    requestOptions.method,
                    requestOptions.url,
                    JSON.stringify(response.data, null, ' ')
                );
                return response.data;
            })
            .catch((err) => {
                if (err.response) {
                    this._logger.error('%s %s response status: %s response body:\n%s',
                        requestOptions.method,
                        requestOptions.url,
                        err.response.status,
                        JSON.stringify(err.response.data, null, ' ')
                    );
                    throw new errors.VaultApiError(`Request to Vault failed with ${err.response.status} response: ${JSON.stringify(err.response.data)}`);
                } else {
                    this._logger.error('%s %s error: %s',
                        requestOptions.method,
                        requestOptions.url,
                        err.message
                    );
                    throw new errors.VaultApiError(`Request to Vault failed with error: ${err.message}`)
                }
            });
    }
}

module.exports = VaultApiClient;
