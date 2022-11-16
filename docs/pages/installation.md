
## Quick Start

[![NPM version](https://img.shields.io/npm/v/@uc-engg/marc)](https://www.npmjs.com/package/@uc-engg/marc)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/urbanclap-engg/marc/blob/main/LICENSE)

 Node: **v14.18**
 
 Npm: **v6.14.15**


### Installation

Clone this sample NodeJS application built using openapi-rpc
```sh
git clone https://github.com/urbanclap-engg/sample-service.git
cd sample-service
```
Install Dependencies:
```sh
npm install
```
Start the Server:
```sh
npm start
```

Test Api call:

```sh
    curl --location --request POST 'http://localhost:1002/sample-service/testApi?client_id=sample-service'
        --header 'Content-Type: application/json'
        --data-raw '{}'
```

For reference checkout [sample-service](https://github.com/urbanclap-engg/sample-service) 

[Next >>](https://urbanclap-engg.github.io/marc/#/pages/usage)