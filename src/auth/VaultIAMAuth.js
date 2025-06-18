'use strict';

const VaultBaseAuth = require('./VaultBaseAuth');
const aws4 = require('aws4');
const _ = require('lodash');
const errors = require('../errors');

/**
 * Implementation of AWS Auth Backend :: IAM Authentication Method
 * @link https://www.vaultproject.io/docs/auth/aws.html#iam-authentication-method
 *
 * @usage
 *
 * ```bash
 * vault write auth/aws/config/client secret_key=AWS_SECRET_KEY access_key=AWS_ACCESS_KEY
 * vault write auth/aws/config/client iam_server_id_header_value=VAULT_ADDR
 * vault write auth/aws/role/iam_name_of_role auth_type=iam bound_iam_principal_arn=arn:aws:iam::.... max_ttl=500h
 * ```
 *
 * ```js
 *
 * VaultClient.boot('main', {
 *       api: { url: VAULT_ADDR },
 *       auth: {
 *           type: 'iam',
 *           mount: 'some_other_aws_mount_point',          // Optional
 *           config: {
 *               role: 'my_iam_role',
 *               iam_server_id_header_value: VAULT_ADDR,   // Optional
 *               credentials: defaultProvider(),           // from `@aws-sdk/credential-provider-node`
 *               region: AWS_REGION                        // Optional
 *           }
 *       }
 *   })
 *
 * ```
 *
 */
class VaultIAMAuth extends VaultBaseAuth {
    /**
     * @param {VaultApiClient} api - see {@link VaultBaseAuth#constructor}
     * @param {Object} logger
     * @param {Object} config
     * @param {String} config.role - Role name of the auth/{mount}/role/{name} backend.
     * @param {AWS.Credentials|AWS.Credentials[]|()=>Promise<AWS.Credentials>} config.credentials Either an AWS `Credentials` object (v2 or v3),
     * or an array of AWS `Credentials` objects to pass to `AWS.CredentialProviderChain` (v2)
     * or an AWS `Provider<Credentials>` function (v3, see `@aws-sdk/credential-provider-node`)
     * @param {AWS.ConfigurationOptions.region} [config.region] Optional. Specify this to use an STS regional endpoint. {@see AWS.ConfigurationOptions.region}
     * @param {String} [config.iam_server_id_header_value] - Optional. Header's value X-Vault-AWS-IAM-Server-ID.
     * @param {String} mount - Vault's AWS Auth Backend mount point ("aws" by default)
     */
    constructor(api, logger, config, mount) {
        super(api, logger, mount || 'aws');

        this.__role = config.role;
        this.__iam_server_id_header_value = config.iam_server_id_header_value;

        if (!config.credentials) {
            throw new errors.InvalidAWSCredentialsError('Credentials must be provided.')
        }

        this.__credentialProvider = config.credentials

        this.__stsHostname = config.region
          ? `sts.${config.region}.amazonaws.com`
          : undefined
    }

    /**
     * @inheritDoc
     */
    _authenticate() {
        this._log.info(
            'making authentication request: role=%s',
            this.__role
        );

        return Promise.resolve()
            .then(() => this.__getCredentials())
            .then((credentials) => {
                return this.__apiClient.makeRequest(
                    'POST',
                    `/auth/${this._mount}/login`,
                    this.__getVaultAuthRequestBody(this.__getStsRequest(credentials))
                );
            })
            .then((response) => {
                this._log.debug(
                    'receive token: %s',
                    response.auth.client_token
                );
                return this._getTokenEntity(response.auth.client_token)
            })
    }

    /**
     * AWS Credentials
     *
     * @returns {AWS.Credentials|Promise<AWS.Credentials>}
     * @private
     */
    __getCredentials() {
        if (Array.isArray(this.__credentialProvider)) {
            const AWS = require('aws-sdk')
            const chain = new AWS.CredentialProviderChain(this.__credentialProvider);
            return new Promise((resolve, reject) =>
              chain.resolve((err, credentials) =>
                err ? reject(err) : resolve(credentials)
              )
            );
        }

        if (typeof this.__credentialProvider === 'function') {
            return this.__credentialProvider()
        }

        return this.__credentialProvider
    }

    /**
     * Prepare vault auth request body
     *
     * @param stsRequest
     * @returns {Object} {@link https://www.vaultproject.io/docs/auth/aws.html#via-the-api}
     * @private
     */
    __getVaultAuthRequestBody(stsRequest) {
        return {
            iam_http_request_method: stsRequest.method,
            iam_request_headers: this.__base64encode(
                JSON.stringify(this.__headersLikeGolangStyle(stsRequest.headers))
            ),
            iam_request_body: this.__base64encode(stsRequest.body),
            iam_request_url: this.__base64encode(`https://${stsRequest.hostname}${stsRequest.path}`),
            role: this.__role
        }
    }

    /**
     * Prepare signed request to AWS STS :: GetCallerIdentity
     *
     * @param credentials
     * @private
     */
    __getStsRequest(credentials) {
        return aws4.sign({
            service: 'sts',
            hostname: this.__stsHostname,
            method: 'POST',
            body: 'Action=GetCallerIdentity&Version=2011-06-15',
            headers: this.__iam_server_id_header_value ? {
                'X-Vault-AWS-IAM-Server-ID': this.__iam_server_id_header_value,
            } : {}
        }, credentials);
    }

    /**
     * @param string
     * @private
     */
    __base64encode(string) {
        return Buffer.from(string).toString('base64')
    }

    /**
     * @link https://github.com/hashicorp/vault/issues/2810
     * @link https://golang.org/pkg/net/http/#Header
     *
     * @param {Object} headers
     * @returns {Object}
     * @private
     */
    __headersLikeGolangStyle(headers) {
        return _.mapValues(headers, (value) => [`${value}`]);
    }
}

module.exports = VaultIAMAuth;
