# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0]
### Added
- New output properties:
  - The `version` number of the returned entry
  - The released `date` of the returned entry
  - The `status` of the release based on the version number and the title line of the entry.
    Could be equal to `unreleased`, `prereleased`, `released` or `yanked`.
    Please refer to https://semver.org/#semantic-versioning-specification-semver for more informations about this.

### Changed
- **[BREAKING CHANGE]** If given a specific target version, action will now generate an error response if that version is not found in the changelog.
- **[BREAKING CHANGE]** `log_entry` output property is renamed to `changes`.

## 1.3.1
### Fixed
- Allow developers to NOT use a date for each version entries.

## 1.3.0
### Changed
- Dates should follow the format used in the ["Keep a Changelog"](https://keepachangelog.com/en/1.0.0/) specification
  which is `YYYY-MM-DD`. Another format that may work is `YYYY-DD-MM`.
  Given the current disclaimer in the `README.md`, this change is **not** a *breaking* change.

### Fixed
- Improve SEMVER support. Now recognize complex version number based on https://semver.org.

## 1.2.0
### Added
- New support for "Unreleased" section. It is possible to ask for the "Unreleased" section
  by setting `version: "Unreleased"` in the `workflow.yml` file.

### Fixed
- Improve the way the project is linted

## 1.1.0
### Added
- The project has now a CHANGELOG
- Add logging message to make the debugging session easier

### Changed
- When no log entry is found, the error state of the action doesn't break the workflow anymore

### Fixed
- README now uses the correct version number in the examples
- Support X.X.X version pattern

## 1.0.1
### Fixed
- Remove template's old behavior

## 1.0.0
### Added
- CHANGELOG can be parsed by the github action
