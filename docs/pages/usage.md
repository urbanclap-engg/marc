


Your Microservice application requires certain standard config files that marc reads for fucntionalities like - service and database dependency, enabling vault or credentials.json file as a secret store. Let's go over these config files in detail. Microservices created via Marc are node 14 compatible. 

## Create apis in your service
Creating business logic in a new microservice is pretty easy with Marc. Need a few configurations and you are ready to run your service on your machine!
Checkout [Sample](https://github.com/urbanclap-engg/sample-service/blob/main/schema/service_schema.json).

### Define schema of your api

`service_schema.json` is a JSON file that contains a detailed description your service APIs (like api path, request and response structure) that adheres to OpenAPI Specification.
This file is present at /schema/service_schema.json. 

### Add service discovery block

We use `global.config.json` to discover microservices/databses discovery. You need to put the service discovery block in `configs/global.config.json` so Marc can use service details for server startup.

- Example
Lets say there are two services sample-service-A & sample-service-B in your ecosystem then you need to define them like this:
```json
{
  'sample-service-A': {
    discovery: {
      port: 1001,
      uri: localhost
    },
    type: 'service'
  },
  'sample-service-B': {
    discovery: {
      port: 1002,
      uri: localhost
    },
    type: 'service'
  }
}
```
Here uri is localhost, assuming the service is running on your machine as development server. For other configurations, checkout sample-service's configs/global.config.json.

### Api definitions

We prefer to keep all service's business logic into src/service folder. Place an index file into src/service/index.ts with a function implementing your api that you defined in service_schema.json.

```Javascript
const testApi = async () => ({ data: 1 + 1 });

const MyApis = {
  testApi,
};

export = {
  ...MyApis,
}

```
Remember to adhere to the schema definition given in the service_schema.json. 

### Initialise server

Now that service discovery and schema are in place, we can initialise the express server. Place server.ts inside src/ with below lines to initialise your service.

```Javascript
'use strict';

const RPCFramework = require('@uc-engg/marc');

RPCFramework.initService();
```
Since marc picks service details from `package.json` with the below information, there is some additional configs you need to ensure:

  ```json
  {
    "name": "<service-id>",
    "main": "index",
    "service_type": "<javascript or typescript>"
  }
  ```

`name`: It should contain the SERVICE_ID which we used to write in server.js. It will now be picked from this key.

`main`: This should contain the controller file path. Here controller file is the file exporting a list of API names mapped to its corresponding handlers. Refer here. Example: If the path for controller file is src/service/index.js, then 'main' should contain- "service/index".

`service_type`: The `service_type` field is used to specify if the service is javascript or typescript, based on that we decide from where to pick the controller file (i.e. dist or src).

Voila! Your microservice is ready to run! Run your new microservice by `npm install`, `npm start`. Test your api by hitting the endpoint.

```
  curl --location --request POST 'http://localhost:1002/sample-service/testApi?client_id=sample-service' \
  --header 'Content-Type: application/json' \
  --data-raw '{}'
```

## Service to service calls

Lets see what all configurations we need to do to call a downstream service.
### Whitelist new service
Any new service that exists within the ecosystem needs to be whitelisted in global.config.json. Lets say there are two services that you need to interact with using Marc, then you can configure them like this:

```json
    "dependency-config": {
        "type": "rpc_config",
        "value": {
            "ID": {
                "INTERNAL_SERVICE": {
                    "test-service-1": "test-service-1"
                },
                "AuditContext": "AuditContext",
```
### Authenticate service calls

`platform.config.json`  is a service specific config which defines the service initialization strategy. Eg -
1. Credential Management (Vault vs local)
2. Service Authorization (services allowed to call)
3. Client service's schema management (how to get service's client swagger docs)

- Whitelist downstream services in `platform.config.json` like this:

```json
{
  "authServiceIds": [
    "sample-service"
  ]
}
```
### Update dependency config

<h1 align="left">
    <img src="./assets/dependency-autocomplete.gif" width="500"/>
    <br>
</h1>

`Dependency types`: Give the type of dependency that the service/script requires. Given below is the list of all dependency types

  - MONGODB
  - MYSQL
  - INTERNAL_SERVICE


List of dependency types can be accessed in dependency.config.ts file through 
  ```Javascript
  require('@uc-engg/marc').getDependencyConfig().TYPE
  ```

You have to create a new config file in this path: configs/dependency.config.ts in the service repo like this: 

```Javascript
{
  service: {
    <dependency_type>: [{
      id: <dependency_id>,
      <options based on schema>
    }]
  }
}
```

  Example of a dependency.config.ts file
```Javascript

'use strict';

const Sequelize = require('sequelize');
const DEPENDENCY = require('@uc-engg/marc').getDependencyConfig();

let Config: DependencyConfigType = {
  service: {
    [DEPENDENCY.TYPE.MONGODB]: [
      {
        id: DEPENDENCY.ID.MONGODB.mongodb_my_test_database,
        mongoose_options: {
          autoIndex: false,
          reconnectTries: Number.MAX_VALUE,
          reconnectInterval: 500,
          poolSize: 10,
          bufferMaxEntries: 0
        }
      }
    ],
    [DEPENDENCY.TYPE.MYSQL]: [
      {
        id: DEPENDENCY.ID.MYSQL.mysql_main_db,
        sequelize_options: {
          pool: { min: 2, max: 4, idle: 60000 },
          isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
          omitNull: true
        },
        sync: true
      }
    ],
    [DEPENDENCY.TYPE.INTERNAL_SERVICE]: [
      {
        id: DEPENDENCY.ID.INTERNAL_SERVICE.sample-service,
        version: 0
      }
    ]
}

module.exports = {
  Config: Config
};
```

### Update dependency's schema

`dependency_schemas.json` This file contains swagger docs of both the service and its downstream microservice clients. This file could be built in couple of ways as mentioned below:

  - [**Default**] Write a custom logic to create this file and configure its location to be picked by the library. By default, dependency_schemas.json is kept at the service's root directory i.e. <service-name>/dependency_schemas.json
  If you are going with custom logic, then configure it in platform.config.js file as shown below.

```json
    {
      "serviceDependencySchema" : {
      "type": "custom",
      "properties": {
        "generatedSchemaFilePath": "dependency_schemas.json",
        }
      }
    }
```

  - [**Gitlab**] If you host your microservice repositories on Gitlab, then this flow is automated by setting the below configuration in platform.config.js file:

```Json
    {
      "serviceDependencySchema" : {
      "type": "gitlab",
      "properties": {
        "generatedSchemaFilePath": "dependency_schemas.json",
        "gitUri": "http://my.gitlab.location.com/",
        "gitToken": "<gitToken>",
        "gitGroupName": "<groupName-optional>"
        }
      }
    }
```

### Make downstream calls
  Once above changes are done, simply make the downstream call like this:

```Javascript
  const Singleton = require('@uc-engg/marc').getSingleton();
  const sampleService = Singleton["sample-service"];

  const testServiceApi = async () => {
    return await sampleService.testApi();
  };
```
Singleton object here is a compiled object of all its dependencies

## Service to database calls

Now that service to service calls are sorted, lets check how to connect to a database, we will re-use some of the configuration files `configs/dependency.config.ts` & `configs/global.config.json` from above.

### Database discovery block

There are majorly two parts to configure database discovery from a service, lets go through both of them to see how we can connect to a database.

- Database to cluster mapping
  Each DB has a unique ID and you would refer to it with this `ID` in your codebase too. It would be of this format: <db_type>_<db_name>. For example, if you are connecting to `my_test_database` database in MongoDB, then the global config should have this key `mongodb_my_test_database`.

```json
  {
    "mongodb_my_test_database": {
      "type": "database",
      "db_type": "mongodb",
      "db_cluster_name": "dev-databases",
      "db_name": "my_test_database"
    }
  }
```

- Database cluster discovery
Add below block in configs/global.config.json to connect your service with database.

```json
  {
    "database-uri": {
      "mongodb": {
        "mongodb_my_test_database": {
          "uri": "mongodb://__username__:__password__@<mongo-replica-set-url>:<port>/__db_name__?replicaSet=<replica-set-name>"
        }
      },
      "mysql": {
        "MysqlClusterName": {
          "uri": "mysql://__username__:__password__@<mysql-db-url>:<port>/__db_name__"
          }
      }
    }
  }
```
The connection string here will be used at service startup time to connect to the databse. Placeholders  '__username__' & '__password__' are intentional they are supposed to be kept as is.
### Whitelist new database cluster

Just like we whitelisted a service, we must also whitelist a database cluster that we are about to use. Sample on how to do it:

```Javascript
  "dependency-config": {
      "type": "rpc_config",
      "value": {
      "ID": {
        "MONGODB": {
          "mongodb_my_test_database": "mongodb_my_test_database"
      }
    }
  }
}
```

### Configure dependency config

Add database dependency to your service's config like this:

```Javascript
[DEPENDENCY.TYPE.MONGODB]: [{
            id: DEPENDENCY.ID.MONGODB["mongodb_my_test_database"]
   }]
```

### Credentials for database

If you are using credentials from file (instead of vault) then place a block like this in .credentials.json:

```Javascript
{
  "db_type": {
    "cluster_name": {
      "db_name": {
        "readwrite": {
          "username": "sampleUser",
          "password": "samplePassword"
        }
      }
    }
  }
```

Now you can access database within your service like this

```Javascript
  let mongooseConnection = Singleton["mongodb_my_test_database"];
```
All done with minimal pieces of code!

## Rate limit
Rate limit provides functionality to limit calls to a microservice at `api`, `client` and `source` level. To configure this:
- Add rate limit dependency in `dependency.config.ts`
  ```Javascript
  let Config = {
    service: {
      [DEPENDENCY.TYPE.RATE_LIMIT]: [{
        id: DEPENDENCY.ID.rate_limit,
        options: RPC_CONFIG.CUSTOM.rate_limit_config
      }],
    }
  }

  module.exports = {
    Config: Config
  };
  ```
- Add rate_limit_config to `${microservice}.config.json`. It  can be configured in 2 ways:
  1. Configure static rate limit config
    1.1 API Level
    ```JSON
      "rate_limit_config": {
        "useStaticConfig": true,
        "rateLimitPolicy": {
          "uid": "123",
          "serviceType": "microservice",
          "serviceId": "test-service",
          "rateLimits": [
            {
              "attribute": "api",
              "key": "/test/getData",
              "requestLimit": 100
            },
            {
                "attribute": "api",
                "key": "/test/getHeader",
                "requestLimit": 0
            }
          ],
          "timeWindowUnit": "minute",
          "isEnabled": true,
          "updatedBy": "tester"
        },
      }
    ```
    1.2 Client Level
    ```JSON
      "rate_limit_config": {
        "useStaticConfig": true,
        "rateLimitPolicy": {
          "uid": "123",
          "serviceType": "microservice",
          "serviceId": "test-service",
          "rateLimits": [
            {
              "attribute": "api",
              "key": "/test/getData",
              "rateLimits": [
                {
                  "attribute": "client",
                  "key": "xyz",
                  "requestLimit": 50
                }
              ]
            }
          ],
          "timeWindowUnit": "minute",
          "isEnabled": true,
          "updatedBy": "tester"
        },
      }
    ```
    1.3 Source Level
    ```JSON
  "rate_limit_config": {
    "useStaticConfig": true,
    "rateLimitPolicy": {
      "uid": "123",
      "serviceType": "microservice",
      "serviceId": "test-service",
      "rateLimits": [
        {
          "attribute": "api",
          "key": "/test/getData",
          "rateLimits": [
            {
              "attribute": "client",
              "key": "xyz",
              "rateLimits": [
                {
                  "attribute": "source",
                  "key": "google",
                  "requestLimit": 10
                }
              ] 
            }
          ]
        }
      ],
      "timeWindowUnit": "minute",
      "isEnabled": true,
      "updatedBy": "tester"
    },
  }
  ```
  2. Rate limit config from endpoint
  ```JSON
    "rate_limit_config": {
      "useEndPoint": true,
      "endPoint": {
        "url": "https://www.test.com/",
        "authToken": "",
        "body": {
        }
      },
    }
  ```

## Profilers

It's user to perform dynamic code analysis where we can capture characteristics of the application, and then use this information to identify how to make application faster and more efficient.

There are `two` type of profiling
- **Cpu** CPU profiling is nothing more than collecting data about functions which are CPU consuming. And ideally, get a graphic representation of the collected data via `flame graph`. There are two types of CPU Profiling available which are 

 - **On Demand**
  - **Continous**

- **Memory** - Memory profiling allows you to take snapshot of all the objects in the heap at a certain point in time. It shows how your  memory is distributed among objects. It helps you find potential inefficiencies and memory leaks in your programs.

#### CPU Profiling
1. **On Demand** - To perform `On-demand CPU Profiling` you to have to hit the following URL and profiled data will get uploaded to `s3 AWS storage` after  desired time you will receive a URL from where you can download your file or if the service is running on local a file will get created in local.

  **URL**  `http://localhost:1002/triggerProfile`


```json
{
  "profileType": "cpu",
  "duration": 10000
}
```

Here `duration` refers to time you wish to profile a service for(in milliseconds).

  After downloading the file from `s3 AWS storage` you can visualize file using [pprof](https://github.com/google/pprof) tool.

2. **Continous** - To perform `Continous CPU profiling`, set environmental variables
```
export CONTINUOUS_PROFILER_ENABLED=true
export CONTINUOUS_PROFILER_SERVICE_NAME="$SERVICE_ID-$ENV-$container_id"
```
Send new deployment and for visualization open `https://console.cloud.google.com/profiler/`. Profiling will continue for all the containers till the time we revert our changes and send a new deployment

#### Memory Profiling
1. **On Demand** - To perform `On-demand memory Profiling` you to have to hit the following URL and you will receive a `S3 url` to download the dump file.

  **URL**  `http://localhost:1002/triggerProfile`


  **Body**
```json
{
    "profileType": "memory",
}
```

  **To Visualize**
  - Open the google chrome inspect tool.
  - Click on the memory tab
  - Click on load button to load the file you downloaded
  - After the file is loaded, click on the file in left panel
  - You can see the details of the object present in heap

If your service is running on local then a file will get created in local. S3 bucket name, and service's IAM role should  have access to S3 for uploading the file to S3.
