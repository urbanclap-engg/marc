<h1 align="center">
    <img src="./assets/cms-2.gif" width="300"/>
    <br>
</h1>

[![NPM version](https://img.shields.io/npm/v/@uc-engg/securitas)](https://www.npmjs.com/package/@uc-engg/securitas)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/urbanclap-engg/securitas/blob/main/LICENSE)

# Overview
Openapi-rpc provides secure and reliable credential managment using the Hashicorp Vault as its credential store. For this, it uses the [Securitas](https://github.com/urbanclap-engg/securitas) which is responsible for the on-demand fetching of secrets, database credentials etc from Hashicorp vault.

## Prerequisites
If code running on AWS Infra: 
    1. A working(unsealed) Hashicorp Vault server(either single node or HA) with the following services enabled:
        a. 'kv'(v1) secret engine.
        b. 'aws' [AWS IAM auth method](https://www.vaultproject.io/docs/auth/aws#iam-auth-method)

or a json file under the root directory of the service with the name `.credentials.json`. More details in below sections.

## Vault integration
- Currently, Marc authenticates to vault using [AWS IAM auth method](https://www.vaultproject.io/docs/auth/aws#iam-auth-method), so it will work only for code deployed on AWS Infra (EC2, ECS, Lambda etc). For microservices running on local setups, openapi provides functionality to fetch secrets from files.
- The vault url needs to be added under the 'cms_server' key in global-config. Sample: 
    ```Json
    {
        'cms_server': 'http://vault.urbanclap.com:8200/'
    }
    ```
- For each service using Marc, a [vault role](https://www.vaultproject.io/api-docs/auth/aws#create-role) needs to be created on your vault server with the same name as that mentioned in the service's package-json under 'name' field.

### Credentials via file

`.credentials.json` Set credentialStore property here to configure the source to fetch credentials, this is only required if you keep credentials with your repository, more details in below sections.
Put this block inside `configs/platform.config.json`

```json
{
  "credentialStore": "credentials_json"
}
```
At the time of service initialization, openapi will read credential json from `.credential.json` file and store it in Singleton Object under the path `Singleton.Config.CUSTOM.credentials`.

## Openapi-rpc-node with vault

- At the time of service initialization, openapi will do the following:
    a. Authenticate to vault.
    b. Fetch client token from vault.
    c. Create vault client using the [node-vault](https://www.npmjs.com/package/node-vault) package using the token. 
    d. Initialize securitas using this vault client.
    d. Fetch secret json from vault from the path: kv/{environment}/{service_name} via Securitas and assign it to the Singleton object under the path Singleton.Config.CUSTOM.credentials. For example, if for a service 'X', the secret json present under kv/{env}/X is: 
    
    ```Json
    {
       'API_KEY' : "!234XXX",
       'DB_PASSWORD': "123XXX"
    }
    ```, 
    then the Singleton will have:
    ```Json
    {
        Config : {
            'CUSTOM' : {
                'credentials' :  {
                                   'API_KEY' : "!234XXX",
                                  'DB_PASSWORD': "123XXX"
                                 }
            }
        }
    }```

- As the securitas interface will also be available via the Singleton object, the following function can be called at any point in the code to fetch secrets from any path:
    ```javascript
    fetchCredentialsFromVault(
        [
            {
                secretIdentifier: string, // The key against which the fetched json will be mapped
                vaultPath: string // The vault path from where the json needs to be fetched
            }
        ]
    ): Promise<Object>
    ```
    Example Usage: 
    Vault path 1: 'kv/A'
    Secret Json : {
        'key1' : 'val1',
        'key2': 'val2'
    }

    vault path2: 'kv/B'
    Secret Json : {
        'key3': 'val3'
    }

    ```javascript
    const Singleton = require('@uc-engg/marc').getSingleton();
    const { Securitas } = Singleton
    secretPaths = [{secretIdentifier: 'ABC', vaultPath : 'kv/A'},
                   {secretIdentifier: 'XYZ', vaultPath: 'kv/B'}]   
    secrets = await Securitas.fetchCredentialsFromVault(secretPaths)
    ```

    The secret object will look like this:

    ```Json
    {
        'ABC' : {
             'key1' : 'val1',
             'key2': 'val2'
        },
        'XYZ' : {
            'key2': 'val2'
        }

    }
    ```
For more information, checkout the library [Securitas](https://github.com/urbanclap-engg/securitas)!
