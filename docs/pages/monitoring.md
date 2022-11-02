
<h1 align="center">
    <img src="./assets/monitoring.gif" width="300"/>
    <br>
</h1>

[![NPM version](https://img.shields.io/npm/v/@uc-engg/mycroft)](https://www.npmjs.com/package/@uc-engg/mycroft)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/urbanclap-engg/mycroft/blob/main/LICENSE)

# Overview
Openapi-rpc provides monitoring out of the box without requiring any line of code, to enable monitoring you just need to set one environment variable.

  ```
  MYCROFT_MONITORING_ENABLED=true
  
  ```

## How does this work?

Openapi-rpc under the hood uses Mycroft as a monitoring library which does all the heavylifting like initialize, capture and export metrics. 

## How these metrics are exported to Prometheus/TSDB?

Openapi-rpc exposes an endpoint `/getRPCMetrics` which exposes all the metrics captured by Mycroft. It returns the metrics in Promethues ingestable/supported format. We can create a scrape job in prometheus using this endpoint and prometheus will automatically scrape  all the metrics.

Example: 

```
  - job_name: microservice_scrapper
  honor_timestamps: true
  scrape_interval: 1m
  scrape_timeout: 30s
  metrics_path: /getRPCMetrics
  scheme: http
  file_sd_configs:
  - files:
    - /home/ubuntu/prom-sd/prometheus-ecs-sd/data/tasks.json
    refresh_interval: 5m

```
For more information, checkout the library [Mycroft](https://github.com/urbanclap-engg/mycroft)!
