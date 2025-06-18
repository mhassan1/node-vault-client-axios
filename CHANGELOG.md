# Changelog

## [0.11.0] - 2025-06-18
[0.11.0]: https://github.com/mhassan1/node-vault-client-axios/compare/v0.10.0...v0.11.0

- Resolve `new Buffer` deprecation warning
- Add support for more versions of the optional `config` peer dependency

## [0.10.0] - 2023-01-19
[0.10.0]: https://github.com/mhassan1/node-vault-client-axios/compare/v0.9.0...v0.10.0

- Drop support for node 12 and below
- Bump `axios` to v1

## [0.9.0] - 2022-07-18
[0.9.0]: https://github.com/mhassan1/node-vault-client-axios/compare/v0.8.0...v0.9.0

- Add response data to Vault API error message

## [0.8.0] - 2022-04-08
[0.8.0]: https://github.com/mhassan1/node-vault-client-axios/compare/v0.7.0...v0.8.0

- Add support for aws sdk v3 `credentials` in iam auth backend
  - **BREAKING CHANGE:** aws sdk v2 credential providers must be provided as an array
    (e.g. `credentials: [new AWS.ProcessCredentials()]`, instead of
    `credentials: new AWS.ProcessCredentials()`)

## [0.7.0] - 2022-02-08
[0.7.0]: https://github.com/mhassan1/node-vault-client-axios/compare/v0.6.2...v0.7.0

- Add `region` support to iam auth backend

## [0.6.2] - 2021-11-17
[0.6.2]: https://github.com/mhassan1/node-vault-client-axios/compare/v0.6.1...v0.6.2

- Update github refs

## [0.6.1] - 2021-11-16
[0.6.1]: https://github.com/mhassan1/node-vault-client-axios/compare/v0.6.0...v0.6.1

- Fix types

## [0.6.0] - 2021-11-16
[0.6.0]: https://github.com/mhassan1/node-vault-client-axios/compare/v0.5.6...v0.6.0

- Make peer deps optional
- Swap request for axios
- Bump lodash
- Add types
