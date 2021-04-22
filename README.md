# Sample application with SDK

A sample application to demo integration with SDK.

## Setup

This setup assumes you will host the frontend on your workstation.

0. (Make a git clone of this project)
1. Install Node.js. It is advised to set it up through [NVM](https://github.com/creationix/nvm).
2. Make sure you have Yarn installed globally: <https://yarnpkg.com/lang/en/docs/install/>
3. Run `yarn` in the project root to install all dependencies.
4. Put _.env_ file in the root of the project with the following config:

```
REACT_APP_ID=242
REACT_APP_USER_ID=external-id-12345
REACT_APP_API_KEY=api-key-12345
```

- **REACT_APP_ID** can be changed in App interface.
- **REACT_APP_USER_ID** is external user ID (any value can be used for testing).
- **REACT_APP_API_KEY** should match the API Key attribute RXB Application settings (optional).

## Running the Sample application

To start the Sample application, run `yarn start`. You can then open the frontend from the following URL: <http://localhost:3000/>
