# Sample application with SDK

A sample application to demo integration with SDK.

## Release notes

### v1.1.1

- Update .gitignore and sdk version

### v1.1.0

- Add User Id field to provide dynamic user id input. Initialization now contains appId and userId as well.

### v1.0.0

- Add README
- Remove yarn.lock, add package-lock.json
- Add .npmrc file

## Setup

This setup assumes you will host the frontend on your workstation.

0. (Make a git clone of this project)
1. Install Node.js. It is advised to set it up through [NVM](https://github.com/creationix/nvm).
2. Put _.env_ file in the root of the project with the following config:

```
REACT_APP_ID=242
REACT_APP_USER_ID=external-id-12345
REACT_APP_API_KEY=api-key-12345
```

- **REACT_APP_ID** can be changed in App interface.
- **REACT_APP_USER_ID** is external user ID (any value can be used for testing).
- **REACT_APP_API_KEY** should match the API Key attribute RXB Application settings (optional).

3. To test against different environments use different sdk-js packages:
- **"@cere/sdk-js": "2.2.1-dev"** - for DEV
- **"@cere/sdk-js": "2.2.1-stage"** - for STAGE
- **"@cere/sdk-js": "2.2.1"** - for PROD

## Running the Sample application

To start the Sample application, run `npm install` and `npm run start`. You can then open the frontend from the following URL: <http://localhost:3000/>