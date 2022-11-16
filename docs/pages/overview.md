# Marc

A framework to build and deploy microservices in javascript/typescript with minimal config changes.
Marc encapsulates all necessary components for - logging, monitoring, service discovery, caching, db connectivity, credential management, etc. It helps bring down weeks of effort to a couple of hours.

## Features

* Rpc clients
* Schema validation
* Config management (service, DB discovery etc)
* Database and Cache support
* Pub-Sub events model
* Rate limiting
* Circuit breaker
* Async Rpc call
* Standardised error handling
* Vault support for credentials
* Slack notifications
* Monitoring (using Prometheus)
* Scheduled scripts/ workflow support
* Load shedding
* CPU and Memory Profiling
* Language localisation
* Api authentication & authorization
* Standard logging

## Why did we develop this library

A few years ago when we started to move away from monoliths to microservices ecosystem, we faced a bunch of problems:
* What and how to standardise microservices for the entire engg team
* How do we ensure our engineers only focus on business logic abstracting out the nitty gritties of components
* Keeping components easy to configure and more importantly intuitive 

We have built this library with years of understanding of issues we faced with microservices ecosystem. In fact we are still using it at UC for everything backend! 


Go ahead and try it out [Quick Start](https://urbanclap-engg.github.io/marc/#/pages/installation?id=quick-start!)

