## Create apis in your service
Creating business logic in a new microservice is pretty easy with Marc. Need a few configurations and you are ready to run your service on your machine!
Checkout [Sample](https://github.com/urbanclap-engg/sample-service/blob/main/schema/service_schema.json).

### Define schema of your api

`service_schema.json` is a JSON file that contains a detailed description your service APIs (like api path, request and response structure) that adheres to [OpenAPI Specification](https://swagger.io/specification/v2/).
This file is present at /schema/service_schema.json. 
For reference, checkout sample-service's [service_schema.json](https://github.com/urbanclap-engg/sample-service/blob/main/schema/service_schema.json)

### Add service discovery block

We use `global.config.json` to discover microservices/databases discovery. You need to put the service discovery block in `configs/global.config.json` so Marc can use service details for server startup.

Lets say there are two services sample-service & sample-service-B in your ecosystem then you need to define them like this:
```json
{
  'sample-service': {
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

All the service names must be present in global.config.json like this:
```json
    "dependency-config": {
        "type": "rpc_config",
        "value": {
            "ID": {
                "INTERNAL_SERVICE": {
                    "sample-service": "sample-service",
                    "sample-service-B": "sample-service-B"
                },
```
For other configurables checkout [here](https://github.com/urbanclap-engg/sample-service/blob/main/configs/global.config.json)

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
    "name": "<service-name>",
    "service_type": "typescript"
  }
  ```

`name`: It should contain the SERVICE_ID which we used to write in server.js. It will now be picked from this key.

`service_type`: The `service_type` field is used to specify if the service is javascript or typescript, based on that we decide from where to pick the controller file (i.e. dist or src).

Voila! Your microservice is ready to run! Run your new microservice by `npm install`, `npm start`. Test your api by hitting the endpoint.

```
  curl --location --request POST 'http://localhost:1002/sample-service/testApi?client_id=sample-service' \
  --header 'Content-Type: application/json' \
  --data-raw '{}'
```

## Service to service calls

Lets see what all configurations we need to do to call a downstream service.

### Authenticate service calls

`platform.config.json`  is a service specific config which defines the service initialization strategy. Eg -
1. Credential Management (Vault vs local)
2. Service Authorization (services allowed to call)
3. Client service's schema management

- Whitelist downstream services in `platform.config.json` like this:

```json
{
  "authServiceIds": [
    "sample-service"
  ]
}
```
If sample-service calls sample-service-B, then this config should be added to sample-service-B's configs/platform.config.json

### Update dependency config

<h1 align="left">
    <img src="./assets/dependency-autocomplete.gif" width="500"/>
    <br>
</h1>

Client services will configure their dependencies in this file. Dependencies can be another service, database etc.


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

  Example of a dependency.config.js file
```Javascript

'use strict';

const Sequelize = require('sequelize');
const DEPENDENCY = require('@uc-engg/marc').getDependencyConfig();

let Config: DependencyConfigType = {
  service: {
    [DEPENDENCY.TYPE.INTERNAL_SERVICE]: [
      {
        id: DEPENDENCY.ID.INTERNAL_SERVICE["sample-service-B"],
        version: 0
      }
    ]
}

module.exports = {
  Config: Config
};
```

### Specify downstream services’ schema

`dependency_schemas.json` This file contains schema of both the service and its downstream microservices. This file could be built in couple of ways as mentioned below:

  - [**Default**] By default, we need to write a logic to create this file and configure its location to be picked by the library.

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
  const sampleServiceB = Singleton["sample-service-B"];

  const testServiceApi = async () => {
    return await sampleServiceB.testApi();
  };
```
Singleton object here is a compiled object of all its dependencies

## Service to database calls

Now that service to service calls are sorted, lets check how to connect to a database, we will re-use some of the configuration files `configs/dependency.config.ts` & `configs/global.config.json` from above.

### Database discovery block

There are majorly two parts to configure database discovery from a service, lets go through both of them to see how we can connect to a database.

- Database to cluster mapping
  Each DB has a unique ID and you would refer to it with this `ID` in your codebase too. It would be of this format: `<db_type>_<db_name>`. For example, if you are connecting to `my_test_database` database in MongoDB, then the global config should have this key `mongodb_my_test_database`.

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
The connection string here will be used at service startup time to connect to the database. Placeholders  '__username__' & '__password__' are intentional they are supposed to be kept as is.
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

### Update dependency.config.js

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
  "<db_type>": {
    "<db_cluster_name>": {
      "<db_name>": {
        "readwrite": {
          "username": "sampleUser",
          "password": "samplePassword"
        }
      }
    }
  }
```
Replace username & password with actual credentials and now you can access database within your service like this

```Javascript
  const Singleton = require('@uc-engg/marc').getSingleton();
  let mongooseConnection = Singleton["mongodb_my_test_database"];
```
All done with minimal code!

## Rate limit
Rate limit provides functionality to limit calls to a microservice at `api`, `client` and `source` level. To configure this:
- Add rate limit dependency in `dependency.config.js`
  ```Javascript
  const Singleton = require('@uc-engg/marc').getSingleton();
  const RPC_CONFIG = Singleton.Config;
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
  Add rate_limit_config to `${microservice}.config.json`. It  can be configured in 2 ways:
  1. Configure static rate limit config
    
    ***API Level***
    ```JSON
      "rate_limit_config": {
        "useStaticConfig": true,
        "rateLimitPolicy": {
          "uid": "123",
          "serviceType": "microservice",
          "serviceId": "sample-service",
          "rateLimits": [
            {
              "attribute": "api",
              "key": "/testApi",
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
    ***Client Level***
    ```JSON
      "rate_limit_config": {
        "useStaticConfig": true,
        "rateLimitPolicy": {
          "uid": "123",
          "serviceType": "microservice",
          "serviceId": "sample-service",
          "rateLimits": [
            {
              "attribute": "api",
              "key": "/testApi",
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
    ***Source Level***
    ```JSON
  "rate_limit_config": {
    "useStaticConfig": true,
    "rateLimitPolicy": {
      "uid": "123",
      "serviceType": "microservice",
      "serviceId": "sample-service",
      "rateLimits": [
        {
          "attribute": "api",
          "key": "/testApi",
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
1. **On Demand** - To perform `On-demand CPU Profiling` you to have to hit the following URL and profiled data will get uploaded to `s3 AWS storage` after  desired time you will receive a URL from where you can download your file.

  **URL**  `http://localhost:1002/triggerProfiler`


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
1. **On Demand** - To perform `On-demand memory Profiling` you to have to hit the following URL and you will receive an `S3 url` to download the dump file, also you will get the file created at service directory.

  **URL**  `http://localhost:1002/triggerProfiler`


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

## Cache your microservice data
### Flash - A generic caching layer
Cache is a high-speed data storage layer that stores a subset of data, typically transient, so that future requests for that data are served up faster than is possible by accessing the data’s primary storage location. Caching allows you to reuse previously retrieved or computed data efficiently. It is very tedious to onboard cache into service, and a lot of boilerplate code and configuration are needed. 
We have an out-of-the-box caching solution, i.e. Flash, a library using Redis for in-memory central storage. It is built over `ioredis` so that services can onboard cache quickly and conveniently without writing boilerplate code. 
### Installation
`Flash` is currently published at npm registry as  `@uc-engg/flash`, so to install it you need to set the registry as [NPM](https://registry.npmjs.org/) and install flash.
```
npm set registry=https://registry.npmjs.org/
npm install @uc-engg/flash
```
### Usage
There ae two ways to onboard Flash in your service 
1. By using [*MARC*](https://urbanclap-engg.github.io/marc/#/)
2. Without using [*MARC*](https://urbanclap-engg.github.io/marc/#/)



#### Steps to Onboard cache into services with using Marc
It is integrated in [Marc](https://urbanclap-engg.github.io/marc/#/) as one of the dependencies like Internal service, mysql, mongo etc. which is declared in 

```
/configs/dependency.config.js
```
##### Step 1 
Declare Cache as dependency type in dependency.config.json under `service` or `workflow`
block 
```
[DEPENDENCY.TYPE.CACHE]: [{
        id     : DEPENDENCY.ID.cache,
        options: {}
  }]
 ```
 Each type has a particular syntax it follows, for cache both id and options is required 

**Add [@uc-engg/flash]() dependency in the service package.json file**

##### Step 2
Populate the options field with **buckets** configurations.  
```
[DEPENDENCY.TYPE.CACHE]: [{
        id     : DEPENDENCY.ID.cache,
        options: {
          "bucketA": {
            "high_availability": true,
            "default_ttl": 86400,
            "registered_services": ["serviceA", "serviceB"]
          }
        }
  }]
```

1. **high_availability** - Its a boolean value and is true which refers to `HIGH_AVAILABILITY` cluster 
2. **default_ttl** - If you didn't specify `ttl(Time to Live)` during setting of cache value then this vlaue is picked by default and is in `seconds`
3. **registered_services** - List of service_ids that are allowed to do an operation on a bucket 

### Steps to Onboard cache into services without using Marc

##### Step 1 

We have to create a config file with configs for initialising `redis connection` 
1. **connectionConfigs**
```	
  HIGH_AVAILABILITY: {
    config,
    default_options,
    cluster
  },
```
`config` - Connection config host, port where you want to host your cache

`default_options` - Default options for creating redis connection 

`cluster` - Whether you want normal connection or cluster connection (boolean)

**For Example**
```
      "HIGH_AVAILABILITY": {
        "config": [
          {
            "host": "elasticache-cluster.cache.amazonaws.com",
            "port": 9002
          }
        ],
        "default_options": {
          "enableOfflineQueue": false
        },
        "cluster": true
      },
```
2. **serviceConfig**
```
"bucketA": {
	"high_availability": true,
	"default_ttl": 86400,
	"registered_services": ["serviceA", "serviceB"]
}
         
```
`high_availability` - Its a boolean value and is true which refers to HIGH_AVAILABILITY cluster

`default_ttl` - If you didn't specify ttl(Time to Live) during setting of cache value then this vlaue is picked by default and is in seconds

`registered_services` - List of service_ids that are allowed to do an operation on a bucket
 
##### Step 2

**Add [@uc-engg/flash]() dependency in the service package.json file**
Initialize Cache 
```js
import Flash from '@uc-engg/flash'

const Cache = new Flash();
Cache.connect(connectionConfig, serviceConfig, serviceName)	//connectionConfig, serviceConfig initialized in step 1 
```
Now you can start using flash Library

#### Current methods
```js
  //To set data in Cache
	Cache.setData(serviceName, key, data, ttl)
    .then(function(result){
      console.log(result);
    });

  //To get data from Cache
  Cache.getData(serviceName, key) //returns object
    .then(function(data){
      console.log('Your data is', data);
    });
  
  //Check if key exists in Cache
  Cache.checkIfKeyExists(serviceName, key) //returns true/false
    .then(function(exists){
      console.log('Your key exists', exists);
    })

  //To set an array of values in Cache for a key
  Cache.setArrayValues(serviceName, key, values, ttl)
    .then(function(result){
      console.log(result);
    });

  //To get all values of array for a key
  Cache.getArrayValues(serviceName, key)
    .then(function(values){
      console.log(values);
    });
    // Add specified members with given scores to sorted set
    Cache.zadd(bucketName, key, score, data, ttl)
      .then(function (values) {
        console.log(values);
      });
    // Check if value is present in an array
    Cache.checkValueInArray(bucketName, key, value)
      .then(function (values) {
        console.log(values);
      });
    // Delete key from cache
    Cache.deleteKey(bucketName, key)
      .then(function (values) {
        console.log(values);
      });

```

#### Steps to use JSON data type in cache
```js
// Set Json object as cache
    Cache.jsonSet(bucketName, key, data, path, ttl)
      .then(function (values) {
        console.log(values);
      });
    // Get json object as cache
    Cache.jsonGet(bucketName, key, path)  
      .then(function (values) {
        console.log(values);
      });
```
Here path refers to the depth at which you wish to store or retrieve data
```js
    // {f1: 5, f2: {a : 10}} stored at "userKey"
    Cache.jsonSet(bucketName, "userKey", {f1: 5, f2: {a : 10}} , '$') 
    
    // {f1: 5, f2: {a : 10}} will become  {f1: 5, f2: {c: {a: 10}}
    Cache.jsonSet(bucketName, "userKey", {a: {c: 10}} , '$..f2') 
    
    // Same for jsonGet 
    
    // will return what is stored at key f2 {c: {a: 10}}
    Cache.jsonSet(bucketName, "userKey", '$..f2') 
```