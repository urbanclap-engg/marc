import { Workflow } from './workflow';
import { Service } from './service';


const initService = async (rpc_framework) => {
  let service = new Service(rpc_framework);
  await service.initDependency();
  await service.initServer();
  return service;
}

const initWorkflow = async (rpc_framework) => {
  let workflow = new Workflow(rpc_framework);
  await workflow.initDependency();
  await workflow.initServer();
  return workflow;
}

export = {
  initWorkflow: initWorkflow,
  initService: initService,
  service: Service,
  workflow: Workflow
}
