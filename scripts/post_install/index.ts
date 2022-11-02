const postInstall = async() => {
  const { getConfigFiles } = require("./service_configs")
  await getConfigFiles();
  const { fetchSchemas } = require("./dependency_schema");
  await fetchSchemas();
  const { createDtsFilesForServiceSchemas } = require("./typescript_dts");
  await createDtsFilesForServiceSchemas();
  const { createRpcConstInterface } = require("./constant_interface");
  await createRpcConstInterface();
}

postInstall();